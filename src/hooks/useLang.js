import { useSyncExternalStore, useCallback } from "react";
import { LANG, LANGS, DEFAULT_LANG, setLang, onLangChange } from "../data/options.js";
import { loadUi, t } from "../i18n/index.js";
import { loadLang, saveLang } from "../lib/storage.js";
import { applyFont } from "../lib/font.js";
import { langFromPath, syncPath } from "../lib/langPath.js";

// 게임 데이터와 화면 문구를 '둘 다' 받아온 뒤에 알린다.
// 하나만 먼저 바꾸면 옵션은 영어인데 버튼은 한국어인 반쪽 화면이 한 프레임 보인다.
async function apply(lang) {
  applyFont(lang); // 폰트는 먼저 걸어둔다 — 글자가 그려질 때 이미 요청이 나가 있게
  await loadUi(lang);
  await setLang(lang); // 여기서 구독자에게 알림이 간다
  syncPath(lang); // 주소와 <html lang>을 맞춘다 (새로고침은 하지 않는다)

  // 탭 제목 — 새로고침을 안 하니 정적 HTML의 <title>이 앞 언어로 남아 있다.
  // 검색 결과에 뜨는 제목은 그 언어 정적 HTML의 것이고(seo.json), 이건 사용자가 보는 탭이다.
  document.title = t("app.title");
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

// 첫 렌더 전에 언어를 정한다 (main.jsx).
// 나중에 바꾸면 한국어로 한 번 그려졌다가 뒤바뀌는 깜빡임이 보인다.
//
// 주소가 저장값을 이긴다 — /en/ 링크를 받은 사람은 자기 localStorage가 뭐든 영어를 봐야 한다.
// (그 경로의 정적 HTML도 영어 메타를 달고 있다. 둘이 어긋나면 안 된다)
export async function restoreLang() {
  const lang = langFromPath() ?? loadLang(DEFAULT_LANG);
  if (LANGS.includes(lang) && lang !== DEFAULT_LANG) await apply(lang);
  else syncPath(DEFAULT_LANG);
}
