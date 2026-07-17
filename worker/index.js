// 거래소 스탯 이름표 프록시.
//
// 앱이 "거래소에서 가져오기"로 조건을 받았을 때, 우리 옵션 목록에 없는 항목은 stat id만 남는다.
// 그 id를 사람이 읽을 수 있는 이름으로 보여주려면 거래소의 스탯 목록이 필요한데,
// 그 응답엔 CORS 헤더가 없어 브라우저에서 직접 못 읽는다 → 이 워커가 대신 불러 붙여준다.
//
// 검색 ID(rPBBYV9GuQ) → 조건 조회는 제공하지 않는다. 그 API는 IP 단위 레이트리밋이 걸려 있고
// 워커의 공용 IP를 남과 나눠 쓰므로 구조적으로 불안정하다. 조건 가져오기는 북마클릿이 담당한다.
//
// 요청: GET /stats?origin=https://fr.pathofexile.com
//   → { "explicit.stat_123": "…", … }   (그 거래소의 언어로)
//
// ⚠️ 스탯 이름표는 거래소마다 언어가 다르다. 글로벌은 언어별 서브도메인까지 다르다
//    (fr. → 프랑스어, www. → 영어). 예전엔 카카오로 고정돼 있어 영어 사용자에게
//    한국어 이름이 떴다. origin을 안 주면 예전처럼 카카오로 답한다(이미 배포된 옛 앱 하위호환).

const ALLOWED_ORIGINS = [
  "https://poe2.cokeys90.dev",
  "https://poe2-search.web.app",
  "https://poe2-search.firebaseapp.com",
  "http://localhost:5173",
  "http://localhost:4173", // vite preview (빌드본 확인용)
];

// ⚠️ 허용 목록이 없으면 아무 URL이나 대신 불러주는 오픈 프록시가 된다. 거래소만 허용한다.
// 글로벌의 언어별 서브도메인 + 카카오(한국) + 대만. src/lib/trade.js의 GLOBAL_SUB와 짝이다.
const GLOBAL_SUBS = ["www", "kr", "jp", "ru", "br", "th", "fr", "de", "es"];
const ALLOWED_UPSTREAM = new Set([
  ...GLOBAL_SUBS.map((s) => `https://${s}.pathofexile.com`),
  "https://pathofexile.tw",
  "https://poe.kakaogames.com",
]);
const DEFAULT_UPSTREAM = "https://poe.kakaogames.com"; // origin을 안 넘기는 옛 앱

// GGG 정책이 요구하는 식별 가능한 User-Agent (앱/버전 + 연락처).
// 연락처는 이메일 대신 저장소 주소 — 공개 저장소라 이메일 노출을 피한다(이슈로 연락 가능).
const USER_AGENT = "poe2-search/1.0 (+https://github.com/cokeys90/poe2-search)";

function cors(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    Vary: "Origin",
  };
}

const json = (body, status, origin, extra) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors(origin), ...extra },
  });

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== "GET") return json({ error: "GET만 허용" }, 405, origin);

    // 레이트리밋 (wrangler.toml의 [[ratelimits]]) — IP당 분당 20회. 정상 사용자는
    // "가져오기" 한 번에 몇 호출뿐이라 안 걸리고, curl 루프 같은 남용만 막는다.
    // OPTIONS(프리플라이트)는 위에서 이미 빠졌다. 캐시·업스트림보다 앞에 둬서 남용
    // 트래픽이 그 뒤 작업에 도달하지 못하게 한다. period를 바꾸면 Retry-After도 맞출 것.
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const { success } = await env.STATS_LIMITER.limit({ key: ip });
    if (!success)
      return json({ error: "요청이 너무 잦습니다" }, 429, origin, { "Retry-After": "60" });

    const url = new URL(request.url);
    if (url.pathname !== "/stats") return json({ error: "경로: /stats" }, 404, origin);

    const want = url.searchParams.get("origin") || DEFAULT_UPSTREAM;
    if (!ALLOWED_UPSTREAM.has(want))
      return json({ error: "허용하지 않는 거래소", origin: want }, 400, origin);

    // 스탯 목록은 거의 바뀌지 않는다 → 하루 캐시 (거래소 부담·레이트리밋 완화).
    // ⚠️ 캐시 키에 거래소가 들어가야 한다 — 안 그러면 먼저 온 언어의 이름표가 다른 언어에게도 나간다.
    const cache = caches.default;
    const key = new Request(`${url.origin}/stats?origin=${encodeURIComponent(want)}`, {
      method: "GET",
    });
    const hit = await cache.match(key);
    if (hit) return json(await hit.json(), 200, origin);

    const up = await fetch(`${want}/api/trade2/data/stats`, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    });
    if (!up.ok) return json({ error: "스탯 목록 조회 실패", status: up.status }, up.status, origin);

    const data = await up.json();
    const map = {};
    for (const g of data.result || [])
      for (const e of g.entries || [])
        if (!map[e.id]) map[e.id] = String(e.text).replace(/\n/g, " ");

    ctx.waitUntil(
      cache.put(
        key,
        new Response(JSON.stringify(map), {
          headers: { "Content-Type": "application/json", "Cache-Control": "max-age=86400" },
        })
      )
    );
    return json(map, 200, origin);
  },
};
