// 고정(핀) 설정 저장 — localStorage + JSON. 나중에 즐겨찾기도 여기 확장.
const KEY = "poe2-search:pins";
const VERSION = 1;

export function defaultPins() {
  return {
    common: { price: null, corrupt: null }, // null = 핀 안 됨
    waystone: { tier: null, options: {} },
    tablet: { options: {} },
  };
}

export function loadPins() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultPins();
    const data = JSON.parse(raw);
    if (data.version !== VERSION) return defaultPins(); // 향후 마이그레이션 지점
    const d = defaultPins();
    return {
      common: { ...d.common, ...(data.common || {}) },
      waystone: { ...d.waystone, ...(data.waystone || {}) },
      tablet: { ...d.tablet, ...(data.tablet || {}) },
    };
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
// v2 구조: { version:2, groups:[{ id, name, items:[{ id, name, tab, ... }] }] }
const FAV_KEY = "poe2-search:favorites";
const FAV_VERSION = 2;

function defaultFavData() {
  return { groups: [{ id: "g_default", name: "미분류", items: [] }] };
}

export function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return defaultFavData();
    const data = JSON.parse(raw);
    if (data.version === FAV_VERSION && Array.isArray(data.groups)) {
      return { groups: data.groups };
    }
    // v1(평면 배열) → v2 마이그레이션: 전부 '미분류' 그룹으로
    if (Array.isArray(data.items)) {
      return { groups: [{ id: "g_default", name: "미분류", items: data.items }] };
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
// { [groupKey]: { order: [optId...], hidden: [optId...] } }
// groupKey = `${tab}:${그룹명}` (서판 고유 그룹은 이름에 종류가 들어가 종류별로 갈린다)
const OPT_KEY = "poe2-search:optprefs";

export function loadOptPrefs() {
  try {
    const raw = localStorage.getItem(OPT_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data.groups || {} : {};
  } catch {
    return {};
  }
}

export function saveOptPrefs(groups) {
  try {
    localStorage.setItem(OPT_KEY, JSON.stringify({ version: 1, groups }));
  } catch {
    // 저장 실패는 무시
  }
}
