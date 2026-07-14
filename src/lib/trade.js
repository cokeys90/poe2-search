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
const GLOBAL_SUB = {
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
  const add = (list, tab, tabletType) =>
    list.forEach((c) => {
      if (c.stat_id) m.set(c.stat_id, { key: c.key, tab, tabletType });
      if (c.map_filter) m.set(c.map_filter, { key: c.key, tab, tabletType });
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
    const min = num(s.min);

    // 경로석 상단 6옵션은 스탯이 아니라 엔드게임 필터(map_iir 등)로 들어간다
    if (item.map_filter) {
      if (s.mode === "inc" && min != null) mapFilters[item.map_filter] = { min };
      else if (s.mode === "inc") mapFilters[item.map_filter] = { min: 1 }; // 값 없이 "있으면 됨"
      else skipped.push(item.text); // 거래소 필터엔 제외 개념이 없다
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
      if (min != null) f.value = { min };
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
      p.option = price.currency;
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
let statNames = null;
export async function fetchStatNames(ids) {
  if (!ids?.length) return [];
  if (!statNames && PROXY) {
    try {
      const res = await fetch(`${PROXY}/stats`);
      if (res.ok) statNames = await res.json();
    } catch {
      // 조회 실패 시엔 id를 그대로 보여준다
    }
  }
  return ids.map((id) => statNames?.[id] || id);
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

  const take = (id, mode, min) => {
    // 서판 고정 옵션 — 종류를 알려주는 동시에 잔여 사용 횟수 조건이기도 하다
    const implicitType = BY_IMPLICIT.get(id);
    if (implicitType) {
      tab = "tablet";
      tabletType = implicitType;
      uses = { on: true, min: min == null ? DEFAULT_USES : String(min) };
      return;
    }
    const hit = BY_STAT.get(id);
    if (!hit) {
      skipped.push(id);
      return;
    }
    if (!tab) tab = hit.tab; // 카테고리가 없으면 스탯으로 판별
    if (hit.tabletType) tabletType = hit.tabletType; // 고유 옵션이면 서판 종류까지
    sel[hit.key] = { mode, min: min == null ? "" : String(min) };
  };

  for (const g of query?.stats || []) {
    if (g.disabled) continue; // 거래소에서 꺼둔 그룹은 무시
    for (const f of g.filters || []) {
      if (f.disabled) continue;
      if (g.type === "not") take(f.id, "exc", null);
      else {
        if (g.type === "count") hasCount = true;
        take(f.id, "inc", f.value?.min);
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
    take(key, "inc", v?.min);
  }

  const price = { enabled: false, mode: "exact", min: "", max: "", currency: "exalted" };
  const pf = query?.filters?.trade_filters?.filters?.price;
  if (pf && (pf.min != null || pf.max != null)) {
    price.enabled = true;
    price.currency = pf.option || price.currency;
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
