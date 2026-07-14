import { LEGACY_ID_MAP, LEGACY_TABLET_MAP, LEGACY_GROUP_MAP } from "../data/legacyIdMap.js";

// 고정(핀) 설정 저장 — localStorage + JSON.
// v2: 선택 옵션을 { [안정키]: {mode, min} }로 저장한다. v1은 키가 한국어 원문 해시였고
//     값에 옵션 원문(text/frag/trade)이 통째로 박제돼 있었다 → 언어가 바뀌면 못 쓴다.
const KEY = "poe2-search:pins";
const VERSION = 2;

export function defaultPins() {
  return {
    common: { price: null, corrupt: null }, // null = 핀 안 됨
    waystone: { tier: null, options: {} },
    tablet: { options: {} },
  };
}

// { [옛 optId]: {…옵션, mode, min} } → { [안정키]: {mode, min} }
function migrateSel(options) {
  const out = {};
  for (const [id, s] of Object.entries(options || {})) {
    const key = LEGACY_ID_MAP[id];
    if (!key || !s) continue; // 지금 데이터에 없는 옛 옵션은 버린다
    out[key] = { mode: s.mode === "exc" ? "exc" : "inc", min: s.min ?? "" };
  }
  return out;
}

export function loadPins() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultPins();
    const data = JSON.parse(raw);
    if (data.version !== VERSION && data.version !== 1) return defaultPins();

    const d = defaultPins();
    const pins = {
      common: { ...d.common, ...(data.common || {}) },
      waystone: { ...d.waystone, ...(data.waystone || {}) },
      tablet: { ...d.tablet, ...(data.tablet || {}) },
    };
    if (data.version === 1) {
      pins.waystone.options = migrateSel(pins.waystone.options);
      pins.tablet.options = migrateSel(pins.tablet.options);
      savePins(pins);
    }
    return pins;
  } catch {
    return defaultPins();
  }
}

export function savePins(pins) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, ...pins }));
  } catch {
    // 저장 실패(용량/사생활 모드)는 무시 — 앱 동작에 영향 없음
  }
}

// 즐겨찾기 — 그룹(폴더) 안에 검색 조합 스냅샷. 핀과 별도 키.
// v3 구조: { version:3, groups:[{ id, name, items:[{ id, name, tab, sel:{키:{mode,min}}, … }] }] }
// v2는 sel 키가 한국어 원문 해시였고, tabletType이 한국어("방사능"), 완성된 검색어(pattern)까지
// 저장했다 → 언어를 바꾸면 옛 언어의 검색어가 그대로 남는다. 검색어는 이제 화면에서 매번 만든다.
const FAV_KEY = "poe2-search:favorites";
const FAV_VERSION = 3;

function defaultFavData() {
  return { groups: [{ id: "g_default", name: "미분류", items: [] }] };
}

function migrateFav(it) {
  const { pattern, ...rest } = it; // 저장된 검색어는 버린다 (렌더할 때 현재 언어로 다시 만든다)
  const out = { ...rest, sel: migrateSel(it.sel) };
  if (it.tabletType) out.tabletType = LEGACY_TABLET_MAP[it.tabletType] || it.tabletType;
  return out;
}

export function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return defaultFavData();
    const data = JSON.parse(raw);
    if (data.version === FAV_VERSION && Array.isArray(data.groups)) {
      return { groups: data.groups };
    }
    // v2(한국어 키) → v3
    if (data.version === 2 && Array.isArray(data.groups)) {
      const migrated = {
        groups: data.groups.map((g) => ({ ...g, items: (g.items || []).map(migrateFav) })),
      };
      saveFavorites(migrated);
      return migrated;
    }
    // v1(평면 배열) → v3: 전부 '미분류' 그룹으로
    if (Array.isArray(data.items)) {
      const migrated = {
        groups: [{ id: "g_default", name: "미분류", items: data.items.map(migrateFav) }],
      };
      saveFavorites(migrated);
      return migrated;
    }
    return defaultFavData();
  } catch {
    return defaultFavData();
  }
}

export function saveFavorites(data) {
  try {
    localStorage.setItem(
      FAV_KEY,
      JSON.stringify({ version: FAV_VERSION, groups: data.groups })
    );
  } catch {
    // 저장 실패는 무시
  }
}

// 마지막으로 고른 화폐 — 서판·경로석이 서로 다른 시세라 탭별로 따로 기억한다.
const CUR_KEY = "poe2-search:currency";

export function loadCurrency() {
  const d = { tablet: "exalted", waystone: "exalted" };
  try {
    const raw = localStorage.getItem(CUR_KEY);
    if (!raw) return d;
    const data = JSON.parse(raw);
    return {
      tablet: typeof data.tablet === "string" ? data.tablet : d.tablet,
      waystone: typeof data.waystone === "string" ? data.waystone : d.waystone,
    };
  } catch {
    return d;
  }
}

export function saveCurrency(c) {
  try {
    localStorage.setItem(CUR_KEY, JSON.stringify(c));
  } catch {
    // 저장 실패는 무시
  }
}

// 플로팅 창(즐겨찾기·설정)의 위치·크기·표시모드. UI 설정이라 데이터(FAV_KEY)와 별도 키로 둔다.
// x/y가 null이면 "기본 위치(우하단)" — 실제 좌표는 뷰포트를 알아야 정해지므로 렌더 시 계산한다.
const WIN_VERSION = 1;

export const FAV_WIN_KEY = "poe2-search:favwin";
export const SETTINGS_WIN_KEY = "poe2-search:settingswin";

// 창별 기본값. openWide=true면 첫 방문 시 넓은 화면에서만 열어둔다.
const WIN_DEFAULTS = {
  [FAV_WIN_KEY]: { w: 480, h: 840, view: "card", openWide: true },
  [SETTINGS_WIN_KEY]: { w: 460, h: 420, view: "card", openWide: false },
};

export function defaultWinState(key) {
  const d = WIN_DEFAULTS[key];
  return {
    x: null,
    y: null,
    w: d.w,
    h: d.h,
    view: d.view, // card | list (즐겨찾기 전용)
    open: d.openWide && typeof window !== "undefined" && window.innerWidth >= 1280,
  };
}

export function loadWinState(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultWinState(key);
    const data = JSON.parse(raw);
    if (data.version !== WIN_VERSION) return defaultWinState(key);
    const d = defaultWinState(key);
    return {
      x: typeof data.x === "number" ? data.x : d.x,
      y: typeof data.y === "number" ? data.y : d.y,
      w: typeof data.w === "number" ? data.w : d.w,
      h: typeof data.h === "number" ? data.h : d.h,
      view: data.view === "list" ? "list" : "card",
      open: !!data.open,
    };
  } catch {
    return defaultWinState(key);
  }
}

export function saveWinState(key, s) {
  try {
    localStorage.setItem(key, JSON.stringify({ version: WIN_VERSION, ...s }));
  } catch {
    // 저장 실패는 무시
  }
}

// 거래소 링크에 쓸 리그 (리그 목록 API는 CORS가 없어 런타임 조회 불가 → 사용자가 설정에서 고른다)
const LEAGUE_KEY = "poe2-search:league";

export function loadLeague(fallback) {
  try {
    return localStorage.getItem(LEAGUE_KEY) || fallback;
  } catch {
    return fallback;
  }
}

export function saveLeague(id) {
  try {
    localStorage.setItem(LEAGUE_KEY, id);
  } catch {
    // 저장 실패는 무시
  }
}

// 옵션 목록 개인화 — 그룹별 정렬 순서와 숨긴 옵션.
// { [groupKey]: { order: [안정키...], hidden: [안정키...] } }
// groupKey = `${tab}:${그룹id}` (고유 그룹은 `tablet:unique:{종류slug}` — 종류마다 목록이 다르다)
//
// v2: 그룹키·옵션id 모두 언어무관. v1은 그룹키가 한국어 그룹명("tablet:방사능 고유 접미어")이고
//     id가 한국어 원문 해시였다 → 언어를 바꾸면 사용자가 바꿔둔 순서·숨김이 통째로 미아가 된다.
const OPT_KEY = "poe2-search:optprefs";
const OPT_VERSION = 2;

export function loadOptPrefs() {
  try {
    const raw = localStorage.getItem(OPT_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    const groups = data && typeof data === "object" ? data.groups || {} : {};
    if (data.version === OPT_VERSION) return groups;

    // v1 → v2: 그룹키(한국어) 와 그 안의 옵션 id(한국어 해시)를 함께 옮긴다
    const mapIds = (ids) => (ids || []).map((id) => LEGACY_ID_MAP[id]).filter(Boolean);
    const out = {};
    for (const [oldKey, g] of Object.entries(groups)) {
      const newKey = LEGACY_GROUP_MAP[oldKey] || oldKey;
      if (out[newKey]) continue; // 옛 이름 여럿이 한 키로 모이면 먼저 것을 존중
      out[newKey] = { order: mapIds(g?.order), hidden: mapIds(g?.hidden) };
    }
    saveOptPrefs(out);
    return out;
  } catch {
    return {};
  }
}

export function saveOptPrefs(groups) {
  try {
    localStorage.setItem(OPT_KEY, JSON.stringify({ version: OPT_VERSION, groups }));
  } catch {
    // 저장 실패는 무시
  }
}
