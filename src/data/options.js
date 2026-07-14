// 현재 언어의 옵션 풀 — 언어무관 코어(core.js) + 언어별 로케일(locales/{lang}.json)을 key로 잇는다.
//
// 옵션의 정체성은 key다 (ws.pre.deal_extra_fire 등). 텍스트·검색조각·거래소명은 언어마다 다르므로
// 저장(핀·즐겨찾기·옵션순서)과 상태에는 텍스트를 쓰지 말고 반드시 key만 쓴다.
//
// 지금은 한국어 하나뿐이라 모듈 로드 시점에 한 번 조립한다.
// 언어 전환이 붙으면(4단계) 활성 로케일을 갈아끼우는 곳이 여기가 된다.

import { CORE, TABLET_META, TABLET_TYPES, DEFAULT_TABLET_TYPE, DEFAULT_TIER, DEFAULT_USES } from "./core.js";
// import 속성(with type) — Vite는 없어도 되지만 Node(검증 스크립트)는 요구한다
import kr from "./locales/kr.json" with { type: "json" };

export { TABLET_META, TABLET_TYPES, DEFAULT_TABLET_TYPE, DEFAULT_TIER, DEFAULT_USES };

const L = kr; // 활성 로케일

const merge = (list) => list.map((c) => ({ ...c, ...L.options[c.key] }));

export const DATA = {
  waystone: {
    implicit: merge(CORE.waystone.implicit),
    prefix: merge(CORE.waystone.prefix),
    suffix: merge(CORE.waystone.suffix),
  },
  tablet: {
    // 종류마다 붙는 고정 옵션 ("지도에 … 추가 / 잔여 사용 횟수 N회"). 종류당 1개.
    implicit: Object.fromEntries(
      Object.entries(CORE.tablet.implicit).map(([slug, list]) => [slug, merge(list)])
    ),
    prefix: merge(CORE.tablet.prefix),
    suffix: merge(CORE.tablet.suffix),
    unique: Object.fromEntries(
      Object.entries(CORE.tablet.unique).map(([slug, list]) => [slug, merge(list)])
    ),
  },
};

// 그 서판 종류의 고정 옵션 (없을 수 없다)
export const tabletImplicit = (slug) => DATA.tablet.implicit[slug]?.[0] ?? null;

// key → 옵션. 저장된 key(핀·즐겨찾기·거래소 가져오기)를 실제 옵션으로 되살릴 때 쓴다.
export const BY_KEY = new Map();
for (const list of [
  DATA.waystone.implicit,
  DATA.waystone.prefix,
  DATA.waystone.suffix,
  DATA.tablet.prefix,
  DATA.tablet.suffix,
  ...Object.values(DATA.tablet.implicit),
  ...Object.values(DATA.tablet.unique),
]) {
  for (const it of list) BY_KEY.set(it.key, it);
}

// {key: {mode,min}} → {key: {…옵션, mode, min}}. 화면·정규식은 텍스트가 필요하므로 되살린다.
// 데이터에서 사라진 key(옛 저장분)는 조용히 버린다.
export function hydrateSel(slim) {
  const out = {};
  for (const [key, s] of Object.entries(slim || {})) {
    const item = BY_KEY.get(key);
    if (item) out[key] = { ...item, ...s };
  }
  return out;
}

/* ---------- 표시 이름 (언어별) ---------- */

export const tabletName = (slug) => L.tablets[slug] ?? slug;

// 그룹 이름. 고유 접미어 그룹만 서판 종류가 들어간다.
export const groupName = (groupId, tabletType) =>
  groupId === "unique"
    ? L.groups.unique.replace("{type}", tabletName(tabletType))
    : L.groups[groupId];

// 거래소 기본 타입명 — query.type에 넣으면 그 종류·등급만 검색된다
export const tabletBase = (slug) => L.bases[slug];
export const waystoneBase = (tier) => L.bases.waystone.replace("{tier}", tier);
// "경로석 ({tier}등급)" → /^경로석 \((\d+)등급\)$/ — 거래소에서 가져올 때 등급 역파싱
export const waystoneBaseRe = new RegExp(
  "^" +
    L.bases.waystone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("\\{tier\\}", "(\\d+)") +
    "$"
);

// 정규식에 그대로 박히는 게임 내 단어 (등급·타락, 수치 단위)
export const TOKENS = L.tokens;
