import { CORE } from "../data/core.js";
import {
  DATA,
  TABLET_META,
  TABLET_TYPES,
  BY_KEY,
  tabletBase,
  tabletImplicit,
  waystoneBase,
  waystoneBaseRe,
  loadedBaseLangs,
  DEFAULT_USES,
} from "../data/options.js";
import { t } from "../i18n/index.js";
import { currency, currencyFromTrade } from "./currency.js";

/* ── 거래소 ───────────────────────────────────────────────────────
   검색 조건을 ?q=<JSON>으로 실어 보내면 거래소가 알아서 검색을 실행하고
   URL 끝의 검색 ID(예: /6zWVPLP6sG)도 스스로 발급한다 → 우리가 API를 호출할 필요가 없다.

   ⚠️ 거래소(realm)는 언어와 별개 축이다. 셋이고 서로 다른 서버다.
     global — GGG 본서버. ⚠️ **언어별 서브도메인**이 따로 있다(ru./br./de.…) 그리고
              기본 타입명(query.type)이 그 서브도메인의 언어로 나온다. 영어 고정이 아니다.
     kakao  — 한국 서버. 한국어.
     tw     — 대만 서버. 번체. 리그 id까지 중국어다.

   리그 목록은 /api/trade2/data/leagues에 있으나 CORS가 없어 브라우저에서 못 부른다 → 코드에 유지.
   (2026-07 확인: 글로벌은 서브도메인이 달라도 리그 id가 영어로 같다. 대만만 중국어) */

// 언어 → 글로벌 거래소 서브도메인. ⚠️ 우리 언어코드와 다른 게 있다: sp→es, pt→br, us→www.
// ⚠️ worker/index.js의 ALLOWED_UPSTREAM과 짝이다 — 어긋나면 스탯 이름표 조회가 400을 받는다.
//    scripts/test-trade.mjs가 대조한다.
export const GLOBAL_SUB = {
  us: "www",
  kr: "kr",
  jp: "jp",
  ru: "ru",
  pt: "br",
  th: "th",
  fr: "fr",
  de: "de",
  sp: "es",
  tw: "www", // 번체 서브도메인은 없다 — 대만은 별도 서버(pathofexile.tw)를 쓴다
};

const EN_LEAGUES = [
  { id: "Runes of Aldur", label: "Runes of Aldur" },
  { id: "HC Runes of Aldur", label: "HC Runes of Aldur" },
  { id: "Standard", label: "Standard" },
  { id: "Hardcore", label: "Hardcore" },
];

export const TRADE_SITES = {
  global: {
    id: "global",
    // 글로벌은 앱 언어를 그대로 쓴다 — 그 언어 서브도메인으로 보내고 타입명도 그 언어다
    langFor: (lang) => lang,
    baseFor: (lang) =>
      `https://${GLOBAL_SUB[lang] || "www"}.pathofexile.com/trade2/search/poe2`,
    leagues: EN_LEAGUES,
    league: "Runes of Aldur",
  },
  kakao: {
    id: "kakao",
    langFor: () => "kr",
    baseFor: () => "https://poe.kakaogames.com/trade2/search/poe2",
    leagues: [
      { id: "Runes of Aldur", label: "룬 오브 알두르" },
      { id: "HC Runes of Aldur", label: "룬 오브 알두르 (하드코어)" },
      { id: "Standard", label: "스탠다드" },
      { id: "Hardcore", label: "하드코어" },
    ],
    league: "Runes of Aldur",
  },
  tw: {
    id: "tw",
    langFor: () => "tw",
    baseFor: () => "https://pathofexile.tw/trade2/search/poe2",
    leagues: [
      { id: "阿德爾的符文", label: "阿德爾的符文" },
      { id: "阿德爾的符文 專家模式", label: "阿德爾的符文 專家模式" },
      { id: "標準模式", label: "標準模式" },
      { id: "專家模式", label: "專家模式" },
    ],
    league: "阿德爾的符文",
  },
};

// 언어로 거래소를 고른다 (설정이 "자동"일 때). 한국어=카카오, 번체=대만, 나머지=글로벌.
export const siteForLang = (lang) =>
  lang === "kr" ? "kakao" : lang === "tw" ? "tw" : "global";

export const tradeSite = (id) => TRADE_SITES[id] || TRADE_SITES.global;

// 가져오기에서 기본 타입명을 역파싱할 때 훑을 언어들.
// 글로벌은 사용자의 언어로 오고, 카카오는 한국어, 대만은 번체다. 영어는 안전망.
export const importLangs = (lang) => [...new Set([lang, "kr", "us", "tw"])];

const CATEGORY = { waystone: "map.waystone", tablet: "map.tablet" };

const num = (v) => {
  const n = parseInt(String(v ?? "").trim(), 10);
  return isNaN(n) ? null : n;
};

// 서판 종류를 결정하는 고정 옵션(잔여 사용 횟수) → 종류 slug (가져오기에서 종류 판별)
const BY_IMPLICIT = new Map(
  Object.entries(TABLET_META).map(([slug, m]) => [m.implicit, slug])
);

// 거래소 stat_id / 엔드게임 필터 id → 우리 옵션 key (가져오기용 역인덱스).
// 언어무관 코어에서만 만든다 — 언어가 바뀌어도 그대로다. 원문이 필요하면 BY_KEY로 되살린다.
const BY_STAT = (() => {
  const m = new Map();
  // ⚠️ 한 스탯에 옵션이 여럿 물릴 수 있다 — 게임이 같은 스탯을 쓰기 때문이다.
  //    ("지도에 성소 1개 추가 등장"은 공통 접미 복합모드와 감독관 고유 옵션이 함께 쓴다)
  //    그래서 값이 배열이다. 가져올 때 서판 종류를 보고 고른다.
  const push = (id, v) => {
    if (!m.has(id)) m.set(id, []);
    m.get(id).push(v);
  };
  const add = (list, tab, tabletType) =>
    list.forEach((c) => {
      if (c.stat_id) push(c.stat_id, { key: c.key, tab, tabletType, negated: c.negated });
      if (c.map_filter) push(c.map_filter, { key: c.key, tab, tabletType });
    });
  add(CORE.waystone.implicit, "waystone");
  add(CORE.waystone.prefix, "waystone");
  add(CORE.waystone.suffix, "waystone");
  add(CORE.tablet.prefix, "tablet");
  add(CORE.tablet.suffix, "tablet");
  for (const [slug, list] of Object.entries(CORE.tablet.unique)) add(list, "tablet", slug);
  return m;
})();

// 검색 상태(스냅샷) → 거래소 URL.
// 반환: { url, skipped: [거래소에 없는 옵션 원문] }
export function tradeUrl({
  tab,
  tabletType,
  sel,
  mode,
  price,
  corrupt,
  tier,
  uses,
  site = "global",
  lang = "us",
  league,
}) {
  const S = tradeSite(site);
  const siteLang = S.langFor(lang); // 그 거래소가 쓰는 언어 (글로벌은 앱 언어를 따라간다)
  const and = [];
  const not = [];
  const count = [];
  const mapFilters = {};
  const skipped = [];

  // sel은 {안정키: {mode, min}} — 옵션 본문은 항상 현재 데이터에서 되살린다
  for (const [key, s] of Object.entries(sel || {})) {
    const item = BY_KEY.get(key);
    if (!item) continue; // 데이터에서 사라진 옵션(옛 저장분)
    // 거래소와 같은 min/max 모델. 둘 다 없으면 "있기만 하면"
    //
    // ⚠️ 부호가 반대인 옵션(negated) — 거래소엔 "증가/증폭/더 빠르게"만 있고 우리 옵션은
    //    "감소/감폭/더 느리게"다. 아이템엔 그 스탯의 **음수값**으로 들어간다.
    //    화면의 "20% 감소 이상"은 거래소에선 "-20 이하"다 → 부호를 뒤집고 최소·최대를 맞바꾼다.
    //    (min만 지원하던 시절엔 이걸 표현할 수 없어 이 옵션들을 아예 못 보냈다)
    const lo = num(s.min);
    const hi = num(s.max);
    const v = {};
    if (item.negated) {
      if (hi != null) v.min = -hi;
      if (lo != null) v.max = -lo;
    } else {
      if (lo != null) v.min = lo;
      if (hi != null) v.max = hi;
    }
    const hasValue = Object.keys(v).length > 0;

    // 경로석 상단 6옵션은 스탯이 아니라 엔드게임 필터(map_iir 등)로 들어간다
    if (item.map_filter) {
      if (s.mode !== "inc") skipped.push(item.text); // 거래소 필터엔 제외 개념이 없다
      else mapFilters[item.map_filter] = hasValue ? v : { min: 1 }; // 값 없이 "있으면 됨"
      continue;
    }

    if (!item.stat_id) {
      skipped.push(item.text); // 거래소 스탯명이 없는 옵션 (반대 부호 등 미검증 건)
      continue;
    }

    const f = { id: item.stat_id, disabled: false };
    if (s.mode === "exc") {
      not.push(f);
    } else {
      if (hasValue) f.value = v;
      // 우리 앱의 OR = 거래소의 "숫자(count)" 그룹 (최소 1개 충족)
      (mode === "or" ? count : and).push(f);
    }
  }

  // 서판 고정 옵션(잔여 사용 횟수) — 늘 붙어 있는 옵션이라 항상 AND로 넣는다.
  // OR 묶음에 섞으면 "다른 조건 없이 이것만 맞아도 통과"가 돼 검색이 무의미해진다.
  if (tab === "tablet" && uses?.on) {
    const it = tabletImplicit(tabletType);
    const min = num(uses.min);
    if (it?.stat_id) {
      const f = { id: it.stat_id, disabled: false };
      if (min != null) f.value = { min };
      and.push(f);
    }
  }

  const stats = [];
  if (and.length) stats.push({ type: "and", filters: and, disabled: false });
  if (not.length) stats.push({ type: "not", filters: not, disabled: false });
  if (count.length)
    stats.push({ type: "count", filters: count, value: { min: 1 }, disabled: false });

  // 경로석 등급
  const t = num(tier);
  if (tab === "waystone" && t != null) mapFilters.map_tier = { min: t, max: t };

  const filters = {
    type_filters: { filters: { category: { option: CATEGORY[tab] } } },
  };
  // 기본 타입까지 지정하면 종류/등급이 정확히 좁혀진다 (카테고리만 쓰면 서판 8종이 다 섞인다).
  // ⚠️ 앱 언어가 아니라 그 거래소의 언어로 넣어야 한다. 아직 안 받아온 언어면 생략한다
  //    (타입 없이도 카테고리·스탯으로 검색은 되지만 종류가 섞인다 → App이 미리 받아 둔다)
  const baseType =
    tab === "tablet"
      ? tabletBase(tabletType, siteLang)
      : t != null
        ? waystoneBase(t, siteLang)
        : null;
  if (Object.keys(mapFilters).length) filters.map_filters = { filters: mapFilters };
  if (corrupt === "yes" || corrupt === "no")
    filters.misc_filters = { filters: { corrupted: { option: corrupt === "yes" } } };

  if (price?.enabled) {
    const lo = num(price.min);
    const hi = price.mode === "range" ? num(price.max) : lo;
    const p = {};
    if (lo != null) p.min = lo;
    if (hi != null) p.max = hi;
    if (Object.keys(p).length) {
      // option을 안 넣으면 거래소가 모든 화폐를 엑잘 환산해 준다 = "엑잘티드 오브 상당 아이템"
      const opt = currency(price.currency).trade;
      if (opt) p.option = opt;
      filters.trade_filters = { filters: { price: p } };
    }
  }

  const q = {
    query: { status: { option: "securable" }, ...(baseType ? { type: baseType } : {}), stats, filters },
    sort: { price: "asc" },
  };

  const lg = S.leagues.some((l) => l.id === league) ? league : S.league;
  const url = `${S.baseFor(lang)}/${encodeURIComponent(lg)}?q=${encodeURIComponent(JSON.stringify(q))}`;
  return { url, skipped };
}

/* ── 거래소에서 가져오기 ─────────────────────────────────────────
   짧은 검색 ID(rPBBYV9GuQ)에는 조건이 들어 있지 않고, 조건을 얻으려면 거래소 API를 불러야 한다.
   그 API는 CORS가 없어 브라우저에서 못 읽고, 서버로 우회하면 거래소의 IP 레이트리밋에 걸린다
   (공용 IP를 남과 나눠 쓰므로 구조적으로 불안정) → 링크로 가져오는 경로는 두지 않는다.
   대신 북마클릿이 거래소 페이지 안에서 조건을 읽어 이 앱을 열어준다 (API 호출 0회). */

// ?. — 검증 스크립트가 노드에서 이 모듈을 그대로 import한다 (노드엔 import.meta.env가 없다)
const PROXY = import.meta.env?.VITE_TRADE_PROXY || "";

// 못 가져온 옵션의 stat id → 거래소 원문. 필요할 때만(가져오기에서 빠진 게 있을 때만) 받아온다.
//
// ⚠️ 스탯 이름표도 거래소마다 언어가 다르다 (글로벌은 언어별 서브도메인까지). 어느 거래소를
//    읽을지 워커에 알려주지 않으면 영어 사용자에게 한국어 이름이 뜬다 — 실제로 그랬다.
const statNames = new Map(); // 거래소 오리진 → { statId: 이름 }

// 그 거래소의 API 오리진. tradeUrl이 쓰는 baseFor와 같은 도메인이다 (한 곳에서 유도한다)
export const tradeOrigin = (site, lang) => new URL(tradeSite(site).baseFor(lang)).origin;

export async function fetchStatNames(ids, { site = "global", lang = "us" } = {}) {
  if (!ids?.length) return [];
  const origin = tradeOrigin(site, lang);

  if (!statNames.has(origin) && PROXY) {
    try {
      const res = await fetch(`${PROXY}/stats?origin=${encodeURIComponent(origin)}`);
      if (res.ok) statNames.set(origin, await res.json());
    } catch {
      // 조회 실패 시엔 id를 그대로 보여준다
    }
  }
  const map = statNames.get(origin);
  return ids.map((id) => map?.[id] || id);
}

// 북마클릿 — 거래소 페이지에서 조건(window.tradeOpts.state)을 읽어 우리 앱을 열어준다.
// 거래소 API를 호출하지 않으므로(이미 열린 페이지의 값을 읽을 뿐) 레이트리밋·CORS와 무관하다.
// 안내문은 만드는 시점의 언어로 박힌다 — 즐겨찾기에 저장되는 코드라 나중에 못 바꾼다.
export function bookmarkletCode(appOrigin = location.origin) {
  return (
    "javascript:(function(){var o=window.tradeOpts;" +
    `if(!o||!o.state){alert(${JSON.stringify(t("import.alert"))});return;}` +
    `location.href='${appOrigin}/#trade='+encodeURIComponent(JSON.stringify(o.state));})()`
  );
}

// 주소의 #trade=… → 조건 JSON (북마클릿이 넘겨준 값)
export function readHashQuery() {
  const m = String(location.hash || "").match(/^#trade=(.+)$/);
  if (!m) return null;
  try {
    return JSON.parse(decodeURIComponent(m[1]));
  } catch {
    return null;
  }
}

// 거래소 조건 JSON → 우리 앱 상태.
// 반환: { state: {tab, tabletType, tier, sel, mode, price, corrupt, uses}, skipped: [거래소 원문…] }
export function queryToState(query) {
  const skipped = [];
  const sel = {};
  let hasCount = false;
  let tab = null;
  let tabletType = null;
  let tier = "";
  let uses = { on: false, min: DEFAULT_USES };

  // 기본 타입명이 있으면 그것만으로 종류·등급이 확정된다 ("방사능 노출 서판" / "경로석 (15등급)").
  // ⚠️ 타입명은 그 거래소의 언어로 온다. 어느 거래소에서 왔는지는 모르므로 (북마클릿은 조건만
  //    넘긴다) 받아와 둔 거래소 언어를 전부 훑는다. App이 가져오기 전에 미리 받아 둔다.
  const baseType = String(query?.type || "").trim();
  const langs = loadedBaseLangs();
  if (baseType) {
    for (const lang of langs) {
      const hit = TABLET_TYPES.find((slug) => tabletBase(slug, lang) === baseType);
      if (hit) {
        tab = "tablet";
        tabletType = hit;
        break;
      }
      const wm = baseType.match(waystoneBaseRe(lang));
      if (wm) {
        tab = "waystone";
        tier = wm[1];
        break;
      }
    }
  }


  const category = query?.filters?.type_filters?.filters?.category?.option;
  if (category === "map.waystone") tab = "waystone";
  else if (category === "map.tablet") tab = "tablet";

  // ⚠️ 최소·최대를 **둘 다** 읽는다. 예전엔 min만 읽어서, 거래소에서 "무리 규모 최대 0"
  //    (= 무리 규모가 없는 것)으로 걸어 온 조건이 값 없이 옵션만 켜진 채로 들어왔다.
  //    그러면 검색어가 "무리"가 돼 무리 규모가 **있는** 것을 전부 잡는다 — 의미가 뒤집힌다.
  const str = (v) => (v == null ? "" : String(v));
  const take = (id, mode, min, max) => {
    // 서판 고정 옵션 — 종류를 알려주는 동시에 잔여 사용 횟수 조건이기도 하다
    const implicitType = BY_IMPLICIT.get(id);
    if (implicitType) {
      tab = "tablet";
      tabletType = implicitType;
      uses = { on: true, min: min == null ? DEFAULT_USES : String(min), max: str(max) };
      return;
    }
    const cands = BY_STAT.get(id);
    if (!cands?.length) {
      skipped.push(id);
      return;
    }
    // 스탯 하나에 옵션이 여럿이면 (공통 복합모드 vs 감독관 고유) 서판 종류로 고른다.
    // 종류를 아직 모르면 **공통 옵션**을 고른다 — 감독관으로 잘못 넘어가면 종류가 통째로 바뀐다.
    const hit =
      (tabletType && cands.find((c) => c.tabletType === tabletType)) ||
      cands.find((c) => !c.tabletType) ||
      cands[0];

    if (!tab) tab = hit.tab; // 카테고리가 없으면 스탯으로 판별
    // 기본 타입명으로 이미 종류가 정해졌으면 스탯이 덮어쓰지 않는다 (위 선택이 그 종류를 존중한다)
    if (hit.tabletType && !tabletType) tabletType = hit.tabletType;

    // 부호가 반대인 옵션은 내보낼 때 뒤집었으므로 가져올 때 되돌린다 (안 그러면 왕복이 깨진다)
    if (hit.negated) {
      const a = min == null ? null : -min;
      const b = max == null ? null : -max;
      sel[hit.key] = { mode, min: str(b), max: str(a) }; // 부호를 뒤집으면 최소·최대도 뒤바뀐다
      return;
    }
    sel[hit.key] = { mode, min: str(min), max: str(max) };
  };

  for (const g of query?.stats || []) {
    if (g.disabled) continue; // 거래소에서 꺼둔 그룹은 무시
    for (const f of g.filters || []) {
      if (f.disabled) continue;
      if (g.type === "not") take(f.id, "exc", null, null);
      else {
        if (g.type === "count") hasCount = true;
        take(f.id, "inc", f.value?.min, f.value?.max);
      }
    }
  }

  // 엔드게임 필터 (경로석 상단 6옵션 · 등급)
  const mf = query?.filters?.map_filters?.filters || {};
  for (const [key, v] of Object.entries(mf)) {
    if (key === "map_tier") {
      const t = num(v?.min);
      if (t != null) tier = String(t);
      continue;
    }
    take(key, "inc", v?.min, v?.max);
  }

  const price = { enabled: false, mode: "exact", min: "", max: "", currency: "exalted" };
  const pf = query?.filters?.trade_filters?.filters?.price;
  if (pf && (pf.min != null || pf.max != null)) {
    price.enabled = true;
    price.currency = currencyFromTrade(pf.option); // option 없음 = "엑잘티드 오브 상당"
    price.min = pf.min != null ? String(pf.min) : "";
    price.max = pf.max != null ? String(pf.max) : "";
    price.mode = pf.min != null && pf.max != null && pf.min === pf.max ? "exact" : "range";
    if (price.mode === "exact") price.max = "";
  }

  const cf = query?.filters?.misc_filters?.filters?.corrupted?.option;
  const corrupt = cf === true || cf === "true" ? "yes" : cf === false || cf === "false" ? "no" : "any";

  return {
    state: {
      tab: tab || "tablet",
      tabletType,
      tier,
      sel,
      mode: hasCount ? "or" : "and",
      price,
      corrupt,
      uses,
    },
    skipped,
  };
}
