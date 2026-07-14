// 다국어 도입 이전 스키마의 localStorage 픽스처를 만든다 (마이그레이션 검증용).
// 출력된 JS를 브라우저 콘솔에 붙여넣으면 "옛 사용자" 상태가 재현된다.
//
//   node scripts/make-legacy-fixture.mjs

import { LEGACY_ID_MAP } from "../src/data/legacyIdMap.js";
import { BY_KEY } from "../src/data/options.js";

// key → 옛 optId (역인덱스)
const OLD_ID = new Map(Object.entries(LEGACY_ID_MAP).map(([id, key]) => [key, id]));

// 옛 저장분은 옵션 객체를 통째로 박제했다 — 그대로 재현한다
const oldSel = (key, mode, min) => {
  const it = BY_KEY.get(key);
  return [OLD_ID.get(key), { ...it, mode, min }];
};

const pins = {
  version: 1,
  common: { price: null, corrupt: "yes" },
  waystone: {
    tier: "15",
    options: Object.fromEntries([oldSel("ws.imp.item_rarity", "inc", "15")]),
  },
  tablet: {
    options: Object.fromEntries([oldSel("tb.pre.rarity_items_found", "inc", "10")]),
  },
};

const favorites = {
  version: 2,
  groups: [
    {
      id: "g_default",
      name: "미분류",
      items: [
        {
          id: "f_old1",
          name: "옛 즐겨찾기(균열)",
          createdAt: 1,
          tab: "tablet",
          tabletType: "균열", // 한국어
          sel: Object.fromEntries([
            oldSel("tb.breach.pack_size", "inc", "10"),
            oldSel("tb.pre.gold_found", "exc", ""),
          ]),
          mode: "or",
          price: { enabled: false, mode: "exact", min: "", max: "", currency: "exalted" },
          corrupt: "any",
          pattern: '"옛 언어로 저장된 검색어"', // 버려져야 한다
        },
        {
          id: "f_old2",
          name: "옛 즐겨찾기(경로석)",
          createdAt: 2,
          tab: "waystone",
          tier: "16",
          sel: Object.fromEntries([oldSel("ws.imp.pack_size", "inc", "30")]),
          mode: "and",
          price: { enabled: true, mode: "exact", min: "3", max: "", currency: "chaos" },
          corrupt: "no",
          pattern: '"옛 것"',
        },
      ],
    },
  ],
};

// 옛 그룹키(한국어) + 옛 옵션 id
const optprefs = {
  version: 1,
  groups: {
    "tablet:접두어": {
      order: [
        OLD_ID.get("tb.pre.gold_found"), // 골드를 맨 위로 끌어올린 상태
        OLD_ID.get("tb.pre.monsters_effectiveness"),
        OLD_ID.get("tb.pre.rarity_items_found"),
      ],
      hidden: [OLD_ID.get("tb.pre.experience_gain")],
    },
    "tablet:균열 고유 접미어": {
      order: [],
      hidden: [OLD_ID.get("tb.breach.pack_size")],
    },
    "waystone:옵션": {
      order: [],
      hidden: [OLD_ID.get("ws.imp.monster_effect")],
    },
  },
};

const seed = {
  "poe2-search:pins": pins,
  "poe2-search:favorites": favorites,
  "poe2-search:optprefs": optprefs,
};

console.log(
  Object.entries(seed)
    .map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(JSON.stringify(v))});`)
    .join("\n") + "\nlocation.reload();"
);
