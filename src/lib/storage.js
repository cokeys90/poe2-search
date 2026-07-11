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

// 즐겨찾기 — 이름 붙인 검색 조합 스냅샷 배열. 핀과 별도 키.
const FAV_KEY = "poe2-search:favorites";
const FAV_VERSION = 1;

export function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (data.version !== FAV_VERSION || !Array.isArray(data.items)) return [];
    return data.items;
  } catch {
    return [];
  }
}

export function saveFavorites(items) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify({ version: FAV_VERSION, items }));
  } catch {
    // 저장 실패는 무시
  }
}
