// 거래소 스탯 이름표 프록시.
//
// 앱이 "거래소에서 가져오기"로 조건을 받았을 때, 우리 옵션 목록에 없는 항목은 stat id만 남는다.
// 그 id를 사람이 읽을 수 있는 이름으로 보여주려면 거래소의 스탯 목록이 필요한데,
// 그 응답엔 CORS 헤더가 없어 브라우저에서 직접 못 읽는다 → 이 워커가 대신 불러 붙여준다.
//
// 검색 ID(rPBBYV9GuQ) → 조건 조회는 제공하지 않는다. 그 API는 IP 단위 레이트리밋이 걸려 있고
// 워커의 공용 IP를 남과 나눠 쓰므로 구조적으로 불안정하다. 조건 가져오기는 북마클릿이 담당한다.
//
// 요청: GET /stats  → { "explicit.stat_123": "지도에서 발견하는 …", ... }

// 대표 도메인은 poe2.cokeys90.dev. 옛 web.app 주소도 남겨둔다
// (그 주소로 등록해둔 북마클릿이 계속 동작하도록).
const ALLOWED_ORIGINS = [
  "https://poe2.cokeys90.dev",
  "https://poe2-search.web.app",
  "https://poe2-search.firebaseapp.com",
  "http://localhost:5173",
];

const UPSTREAM_STATS = "https://poe.kakaogames.com/api/trade2/data/stats";

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

const json = (body, status, origin) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors(origin) },
  });

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== "GET") return json({ error: "GET만 허용" }, 405, origin);

    const url = new URL(request.url);
    if (url.pathname !== "/stats") return json({ error: "경로: /stats" }, 404, origin);

    // 스탯 목록은 거의 바뀌지 않는다 → 하루 캐시 (거래소 부담·레이트리밋 완화)
    const cache = caches.default;
    const key = new Request(url.toString(), { method: "GET" });
    const hit = await cache.match(key);
    if (hit) return json(await hit.json(), 200, origin);

    const up = await fetch(UPSTREAM_STATS, {
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
