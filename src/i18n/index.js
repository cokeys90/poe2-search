// 화면 문구 번역. 게임 데이터(옵션 원문·조각)는 src/data/locales/ 에 있고, 여기는 UI 문구다.
//
// 라이브러리를 쓰지 않는다 — 복수형·날짜포맷 같은 요구가 없고, 키 200개 미만이라 과하다.
//
// ⚠️ 게임 용어는 번역하지 않는다. 접두어/접미어·타락·등급·서판·경로석은 게임이 쓰는 말이
//    따로 있고, 그걸 안 맞추면 사용자가 화면과 게임을 대조하지 못한다.
//    그런 말은 로케일 데이터(tokens/bases)에서 유도하거나 인게임 캡처에서 가져온다.

import { useSyncExternalStore } from "react";
import { LANG, DEFAULT_LANG, onLangChange } from "../data/options.js";
import kr from "./kr.json" with { type: "json" };

const LOADERS = {
  us: () => import("./us.json"),
  jp: () => import("./jp.json"),
  tw: () => import("./tw.json"),
  ru: () => import("./ru.json"),
  pt: () => import("./pt.json"),
  th: () => import("./th.json"),
  fr: () => import("./fr.json"),
  de: () => import("./de.json"),
  sp: () => import("./sp.json"),
};

const loaded = { kr };
let active = kr;

// 언어가 바뀌면 그 언어의 UI 문구도 받아온다. data/options.js의 setLang이 먼저 끝나 있으므로
// 여기서는 이미 바뀐 LANG을 보고 따라간다.
export async function loadUi(lang) {
  if (loaded[lang]) {
    active = loaded[lang];
    return;
  }
  const mod = await LOADERS[lang]?.();
  loaded[lang] = mod?.default ?? kr; // 없는 언어는 한국어로 버틴다 (빈 화면보다 낫다)
  active = loaded[lang];
}

// {n}, {type} 같은 자리표시자를 채운다
function fill(s, vars) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

// 번역이 없으면 한국어로, 그것도 없으면 키를 그대로 — 화면이 비지 않게 한다.
export function t(key, vars) {
  return fill(active[key] ?? kr[key] ?? key, vars);
}

// 언어가 바뀌면 다시 그린다 (data/options.js의 구독을 그대로 쓴다)
export function useT() {
  useSyncExternalStore(onLangChange, () => LANG, () => DEFAULT_LANG);
  return t;
}
