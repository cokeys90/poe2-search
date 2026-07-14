// 현재 언어의 옵션 풀 — 언어무관 코어(core.js) + 언어별 로케일(locales/{lang}.json)을 key로 잇는다.
//
// 옵션의 정체성은 key다 (ws.pre.deal_extra_fire 등). 텍스트·검색조각·거래소명은 언어마다 다르므로
// 저장(핀·즐겨찾기·옵션순서)과 상태에는 텍스트를 쓰지 말고 반드시 key만 쓴다.
//
// ── 언어 전환 ────────────────────────────────────────────────────
// 기본 언어(한국어)만 정적으로 넣고 나머지는 필요할 때 불러온다(로케일 하나가 28~44KB).
// DATA·BY_KEY·TOKENS는 `let`으로 내보낸다 — ES 모듈의 live binding 덕에 다시 대입하면
// 이미 import한 쪽에도 그대로 반영된다. 대신 **모듈 로드 시점에 값을 캡처해 두면 안 된다**
// (regex.js의 단위 정규식, trade.js의 인덱스가 그랬다 — 함수 안에서 다시 만들도록 고쳤다).

import { CORE, TABLET_META, TABLET_TYPES, DEFAULT_TABLET_TYPE, DEFAULT_TIER, DEFAULT_USES } from "./core.js";
// import 속성(with type) — Vite는 없어도 되지만 Node(검증 스크립트)는 요구한다
import kr from "./locales/kr.json" with { type: "json" };

export { TABLET_META, TABLET_TYPES, DEFAULT_TABLET_TYPE, DEFAULT_TIER, DEFAULT_USES };

// poe2db 언어 코드. cn(简体中文)은 게임이 다른 지역 클라이언트에 제공하지 않아 뺐다.
export const LANGS = ["kr", "us", "jp", "tw", "ru", "pt", "th", "fr", "de", "sp"];
export const DEFAULT_LANG = "kr";

// 기본 언어만 미리 넣는다. 나머지는 setLang()에서 받아온다.
const LOADERS = {
  us: () => import("./locales/us.json"),
  jp: () => import("./locales/jp.json"),
  tw: () => import("./locales/tw.json"),
  ru: () => import("./locales/ru.json"),
  pt: () => import("./locales/pt.json"),
  th: () => import("./locales/th.json"),
  fr: () => import("./locales/fr.json"),
  de: () => import("./locales/de.json"),
  sp: () => import("./locales/sp.json"),
};

let L = kr; // 활성 로케일

const merge = (list) => list.map((c) => ({ ...c, ...L.options[c.key] }));

function build() {
  return {
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
}

function index(data) {
  const m = new Map();
  for (const list of [
    data.waystone.implicit,
    data.waystone.prefix,
    data.waystone.suffix,
    data.tablet.prefix,
    data.tablet.suffix,
    ...Object.values(data.tablet.implicit),
    ...Object.values(data.tablet.unique),
  ]) {
    for (const it of list) m.set(it.key, it);
  }
  return m;
}

export let LANG = DEFAULT_LANG;
export let DATA = build();
// key → 옵션. 저장된 key(핀·즐겨찾기·거래소 가져오기)를 실제 옵션으로 되살릴 때 쓴다.
export let BY_KEY = index(DATA);
// 정규식에 그대로 박히는 게임 내 단어 (등급·타락, 수치 단위)
export let TOKENS = L.tokens;

const listeners = new Set();
export const onLangChange = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export async function setLang(lang) {
  if (lang === LANG || !LANGS.includes(lang)) return;
  L = lang === DEFAULT_LANG ? kr : (await LOADERS[lang]()).default;
  LANG = lang;
  DATA = build();
  BY_KEY = index(DATA);
  TOKENS = L.tokens;
  for (const fn of listeners) fn(lang);
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

// 그 서판 종류의 고정 옵션 (없을 수 없다)
export const tabletImplicit = (slug) => DATA.tablet.implicit[slug]?.[0] ?? null;

/* ---------- 표시 이름 (언어별) ---------- */

export const tabletName = (slug) => L.tablets?.[slug] ?? slug;

// 거래소 기본 타입명 — query.type에 넣으면 그 종류·등급만 검색된다
export const tabletBase = (slug) => L.bases[slug];
export const waystoneBase = (tier) => L.bases.waystone.replace("{tier}", tier);

// "경로석 ({tier}등급)" → /^경로석 \((\d+)등급\)$/ — 거래소에서 가져올 때 등급 역파싱.
// ⚠️ 함수다. 로케일이 바뀌면 정규식도 달라지므로 모듈 로드 시점에 만들어 두면 안 된다.
export const waystoneBaseRe = () =>
  new RegExp(
    "^" +
      L.bases.waystone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("\\{tier\\}", "(\\d+)") +
      "$"
  );
