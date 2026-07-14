import { useSyncExternalStore, useCallback } from "react";
import { LANG, LANGS, DEFAULT_LANG, setLang, onLangChange } from "../data/options.js";
import { loadUi } from "../i18n/index.js";
import { loadLang, saveLang } from "../lib/storage.js";

// 게임 데이터와 화면 문구를 '둘 다' 받아온 뒤에 알린다.
// 하나만 먼저 바꾸면 옵션은 영어인데 버튼은 한국어인 반쪽 화면이 한 프레임 보인다.
async function apply(lang) {
  await loadUi(lang);
  await setLang(lang); // 여기서 구독자에게 알림이 간다
}

// 활성 언어. 로케일은 data/options.js 바깥(모듈)에 있으므로 외부 스토어로 구독한다.
// 언어를 바꾸면 DATA·BY_KEY·TOKENS가 통째로 갈리므로 앱 전체가 다시 그려져야 한다.
export function useLang() {
  const lang = useSyncExternalStore(onLangChange, () => LANG, () => DEFAULT_LANG);

  const change = useCallback(async (next) => {
    if (!LANGS.includes(next)) return;
    await apply(next);
    saveLang(next);
  }, []);

  return { lang, langs: LANGS, setLang: change };
}

// 첫 렌더 전에 저장된 언어를 복원한다 (main.jsx).
// 나중에 바꾸면 한국어로 한 번 그려졌다가 뒤바뀌는 깜빡임이 보인다.
export async function restoreLang() {
  const saved = loadLang(DEFAULT_LANG);
  if (saved !== DEFAULT_LANG && LANGS.includes(saved)) await apply(saved);
}
