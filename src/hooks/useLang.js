import { useSyncExternalStore, useCallback } from "react";
import { LANG, LANGS, DEFAULT_LANG, setLang, onLangChange } from "../data/options.js";
import { loadLang, saveLang } from "../lib/storage.js";

// 활성 언어. 로케일은 data/options.js 바깥(모듈)에 있으므로 외부 스토어로 구독한다.
// 언어를 바꾸면 DATA·BY_KEY·TOKENS가 통째로 갈리므로 앱 전체가 다시 그려져야 한다.
export function useLang() {
  const lang = useSyncExternalStore(onLangChange, () => LANG, () => DEFAULT_LANG);

  const change = useCallback(async (next) => {
    if (!LANGS.includes(next)) return;
    await setLang(next); // 로케일 파일을 받아온 뒤에야 알림이 간다 (반쯤 바뀐 화면 방지)
    saveLang(next);
  }, []);

  return { lang, langs: LANGS, setLang: change };
}

// 첫 렌더 전에 저장된 언어를 복원한다. main.jsx에서 await 한다 —
// 옵션 목록이 한국어로 한 번 그려졌다가 바뀌는 깜빡임을 막는다.
export async function restoreLang() {
  const saved = loadLang(DEFAULT_LANG);
  if (saved !== DEFAULT_LANG) await setLang(saved);
}
