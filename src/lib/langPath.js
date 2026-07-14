// 언어 ↔ URL 경로. 한국어는 루트("/"), 나머지는 접두어("/en/", "/ja/" …).
//
// ⚠️ scripts/data/seo.json의 path와 반드시 같아야 한다 — 그쪽이 언어별 정적 HTML을 만들고
//    hreflang·canonical을 그 경로로 건다. 여기가 어긋나면 크롤러가 본 URL과 앱이 켜는 언어가 달라진다.
//    (경로 코드는 BCP-47에 가깝게 둔다. 우리 언어코드 us·sp·kr과 다르다)

export const LANG_PATH = {
  kr: "",
  us: "en",
  jp: "ja",
  tw: "zh-tw",
  ru: "ru",
  pt: "pt-br",
  th: "th",
  fr: "fr",
  de: "de",
  sp: "es",
};

const BY_PATH = Object.fromEntries(
  Object.entries(LANG_PATH)
    .filter(([, p]) => p)
    .map(([lang, p]) => [p, lang])
);

// 주소에서 언어를 읽는다. 접두어가 없으면 null (= 저장값이나 기본값을 쓰라는 뜻)
export function langFromPath(pathname = location.pathname) {
  const first = pathname.split("/")[1]?.toLowerCase();
  return BY_PATH[first] ?? null;
}

// 언어를 바꿔도 다시 그리기만 하고 새로고침은 하지 않는다(선택한 옵션이 날아가면 안 되니까).
// 대신 주소는 맞춰 둔다 — 그 상태로 링크를 복사해 공유할 수 있어야 하고, 크롤러가 오면
// 그 경로의 정적 HTML(자기 언어 메타)을 받게 된다.
export function syncPath(lang) {
  const p = LANG_PATH[lang];
  const next = (p ? `/${p}/` : "/") + location.search + location.hash;
  if (location.pathname + location.search + location.hash !== next) {
    history.replaceState(null, "", next);
  }
  document.documentElement.lang = HTML_LANG[lang] ?? lang;
}

// <html lang> — 크롤러·스크린리더가 본다. seo.json의 htmlLang과 같아야 한다.
const HTML_LANG = {
  kr: "ko",
  us: "en",
  jp: "ja",
  tw: "zh-Hant-TW",
  ru: "ru",
  pt: "pt-BR",
  th: "th",
  fr: "fr",
  de: "de",
  sp: "es",
};
