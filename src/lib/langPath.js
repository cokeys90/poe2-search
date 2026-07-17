// 주소 = /{언어}/{페이지}/ — 둘 다 생략 가능하다.
//
//   /              한국어 · 통합       /waystone/      한국어 · 경로석
//   /en/           영어 · 통합         /en/tablet/     영어 · 서판
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

// 페이지 = 앱의 탭. 세그먼트는 **영어 고정**이다 — 언어마다 번역하면 URL이 언어 수만큼 갈리는데,
// 얻는 건 없고(구글은 URL 낱말을 거의 안 본다) 북마클릿·공유 링크의 하위호환만 복잡해진다.
// 값은 App의 tab과 같은 낱말이어야 한다 ("waystone" | "tablet").
export const PAGES = ["waystone", "tablet"];

const BY_PATH = Object.fromEntries(
  Object.entries(LANG_PATH)
    .filter(([, p]) => p)
    .map(([lang, p]) => [p, lang])
);

// 주소를 {lang, page}로 가른다. 언어 접두어는 있을 수도 없을 수도 있다(한국어는 루트).
// 못 알아본 값은 null — "저장값이나 기본값을 쓰라"는 뜻이다.
export function parsePath(pathname = location.pathname) {
  const seg = pathname.split("/").filter(Boolean).map((s) => s.toLowerCase());
  const lang = BY_PATH[seg[0]] ?? null;
  const page = lang ? seg[1] : seg[0]; // 언어가 있으면 그 다음이 페이지다
  return { lang, page: PAGES.includes(page) ? page : null };
}

// 주소에서 언어를 읽는다. 접두어가 없으면 null (= 저장값이나 기본값을 쓰라는 뜻)
export function langFromPath(pathname = location.pathname) {
  return parsePath(pathname).lang;
}

// 주소에서 페이지를 읽는다. 없으면 null (= 통합 페이지로 들어왔다는 뜻)
export function pageFromPath(pathname = location.pathname) {
  return parsePath(pathname).page;
}

export function buildPath(lang, page) {
  const seg = [LANG_PATH[lang], PAGES.includes(page) ? page : ""].filter(Boolean);
  return "/" + (seg.length ? seg.join("/") + "/" : "");
}

// 언어나 탭을 바꿔도 다시 그리기만 하고 새로고침은 하지 않는다(선택한 옵션이 날아가면 안 되니까).
// 대신 주소는 맞춰 둔다 — 그 상태로 링크를 복사해 공유할 수 있어야 하고, 크롤러가 오면
// 그 경로의 정적 HTML(자기 언어·페이지의 메타)을 받게 된다.
//
// page를 안 넘기면 지금 주소의 것을 유지한다 — 언어만 바꿀 때 보던 탭이 루트로 튕기면 안 된다.
export function syncPath(lang, page = pageFromPath()) {
  const next = buildPath(lang, page) + location.search + location.hash;
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
