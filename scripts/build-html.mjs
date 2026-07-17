// 언어별·페이지별 정적 HTML + 사이트맵 생성 (vite build 뒤에 돈다).
//
//   node scripts/build-html.mjs      (npm run build이 자동으로 부른다)
//
// 왜 정적이어야 하는가 — 크롤러는 JS를 돌리기 전의 <head>를 본다. 앱 안에서 t()로 title을
// 바꿔 봐야 검색 결과에는 한국어 제목만 남는다. 그래서 언어마다 진짜 파일을 만든다.
//
// 왜 페이지를 나누는가 — "경로석 검색기"와 "서판 검색"은 구글에게 다른 질문이다. URL 하나로
// 둘 다 받으면 어느 쪽으로도 정확히 대응하지 못한다. 그래서 탭마다 진짜 URL을 준다:
//
//   dist/index.html              한국어 · 허브      dist/waystone/index.html   한국어 · 경로석
//   dist/en/index.html           영어 · 허브        dist/en/tablet/index.html  영어 · 서판
//   …                                               (10개 언어 × 3 = 30개)
//
// 각 파일은 자기 언어·페이지의 title·description·og·JSON-LD를 갖고, hreflang으로 **같은 페이지의**
// 다른 언어를 가리킨다(/waystone/의 짝은 /en/waystone/이지 /en/이 아니다).
// 파일이 실제로 있으므로 Firebase가 그대로 내려준다 (rewrite는 파일이 없을 때만 걸린다).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { LANG_PATH, PAGES } from "../src/lib/langPath.js";
import { itemWords } from "./lib/item-words.mjs";

const ORIGIN = "https://poe2.cokeys90.dev";
const SEO = JSON.parse(readFileSync("scripts/data/seo.json", "utf8"));
const LANGS = Object.keys(SEO).filter((k) => !k.startsWith("_"));

// 허브(null) + 탭별 랜딩. 순서가 사이트맵 순서다.
const ROUTES = [null, ...PAGES];

// 앱이 아는 경로와 여기서 만드는 경로가 어긋나면 조용히 깨진다
// (크롤러가 본 /es/에 파일이 없거나, 앱이 /es/를 스페인어로 못 알아본다)
for (const lang of Object.keys(LANG_PATH)) {
  if (!SEO[lang]) throw new Error(`seo.json에 ${lang}이 없다`);
  if (SEO[lang].path !== LANG_PATH[lang])
    throw new Error(
      `${lang}: 경로 불일치 — seo.json="${SEO[lang].path}" vs langPath.js="${LANG_PATH[lang]}"`
    );
  for (const page of PAGES)
    if (!SEO[lang].pages?.[page]) throw new Error(`seo.json의 ${lang}에 pages.${page}가 없다`);
}
if (LANGS.length !== Object.keys(LANG_PATH).length)
  throw new Error("seo.json과 langPath.js의 언어 수가 다르다");

const url = (path, page) =>
  `${ORIGIN}/` + [path, page].filter(Boolean).join("/") + (path || page ? "/" : "");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/* ── 언어별 게임 용어 ────────────────────────────────────────────
   ⚠️ SEO 문구에 게임 용어를 손으로 적지 말 것 — 게임 표기가 바뀌면 조용히 어긋난다.
   seo.json은 {waystone} {tablet} {types}만 두고, 값은 로케일에서 온다(CLAUDE.md §6-0).
   경로석·서판 이름은 bases에서 유도한다 — 거래소 API로 대조되는 값이다. */
const locales = Object.fromEntries(
  LANGS.map((l) => [l, JSON.parse(readFileSync(`src/data/locales/${l}.json`, "utf8"))])
);

const terms = Object.fromEntries(
  LANGS.map((l) => {
    const loc = locales[l];
    const w = itemWords(loc);
    return [l, { ...w, types: Object.values(loc.tablets).join(" · ") }];
  })
);

const fill = (s, lang) =>
  s.replace(/\{(waystone|tablet|types)\}/g, (_, k) => terms[lang][k]);

// 그 페이지의 메타. 허브는 언어 루트, 나머지는 pages.{page}. 문구의 게임 용어는 채워서 준다.
function meta(lang, page) {
  const s = SEO[lang];
  const raw = page ? s.pages[page] : s;
  const out = {};
  for (const k of ["title", "desc", "ogTitle", "ogDesc", "ldName", "ldDesc"])
    out[k] = fill(raw[k], lang);
  return out;
}

/* ── 정적 본문 ───────────────────────────────────────────────────
   ⚠️ 이게 없으면 크롤러가 보는 <body>는 빈 <div id="root">뿐이다.
   구글은 JS를 실행해 주지만 2차 렌더링 큐라 늦고, 작은 사이트는 그 예산을 잘 못 받는다.
   네이버·빙·SNS 미리보기는 아예 JS를 안 돌린다 → 30개 페이지가 전부 빈 껍데기로 색인된다.

   #root 안에 넣는다 — React가 마운트하면서 통째로 갈아치운다(앱 셸 폴백).
   sr-only(화면 밖) 인라인 스타일로 시각적으로만 가린다. 클로킹이 아니다 — React가
   똑같은 내용의 실제 앱으로 갈아치우므로 크롤러·사용자가 보는 게 결국 같다. 크롤러·
   스크린리더는 DOM의 이 텍스트를 그대로 읽는다. 가리는 건 마운트 전 잠깐 보이던
   맨 텍스트 깜빡임뿐. ⚠️ CSS 클래스가 아니라 인라인이어야 한다 — 외부 CSS 로드 전
   순간에도 먹어야 깜빡임이 안 남는다.

   내용은 **우리가 이미 가진 데이터**에서만 뽑는다: 그 언어의 옵션 원문·서판 종류명(poe2db 원문).
   지어내면 그 언어 사용자가 검색해서 들어왔을 때 화면과 다른 말이 적혀 있게 된다.

   페이지마다 **실제로 다른 본문**이어야 한다 — 같은 내용을 URL만 바꿔 내면 중복으로 묶여
   나누는 뜻이 없어진다. 그래서 경로석 페이지엔 경로석 옵션(41개), 서판 페이지엔 서판
   옵션(85개)만 싣는다. 링크는 크롤러가 세 페이지를 서로 찾아가는 길이다(사이트맵보다 강하다). */
const SR_ONLY =
  "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0";

// 그 페이지에 실을 옵션 원문. 키 앞머리가 아이템을 가른다 (ws.* 경로석 / tb.* 서판).
// 부가 옵션(extra)은 싣지 않는다 — 검색 대상이 아니다(CLAUDE.md §3-4).
function optionTexts(lang, page) {
  const prefix = page === "waystone" ? "ws." : "tb.";
  const opts = locales[lang].options;
  const seen = new Set();
  for (const [key, o] of Object.entries(opts))
    if (key.startsWith(prefix) && o.text) seen.add(o.text);
  return [...seen];
}

function shell(lang, page) {
  const m = meta(lang, page);
  const t = terms[lang];
  const link = (p) =>
    `<a href="${url(SEO[lang].path, p)}">${esc(meta(lang, p).ldName)}</a>`;

  // 허브 — 두 페이지로 가는 길. 아이템 이름과 서판 종류만 얹는다.
  if (!page) {
    return `<h1>${esc(m.ldName)}</h1>
        <p>${esc(m.desc)}</p>
        <nav>${PAGES.map(link).join(" · ")}</nav>
        <h2>${esc(t.waystone)}</h2>
        <h2>${esc(t.tablet)}</h2>
        <p>${esc(t.types)}</p>`;
  }

  const others = [null, ...PAGES.filter((p) => p !== page)];
  const nav = others
    .map((p) => (p ? link(p) : `<a href="${url(SEO[lang].path, null)}">${esc(SEO[lang].ldName)}</a>`))
    .join(" · ");

  // 서판 페이지엔 종류 8종을 기본 타입명 그대로 얹는다 ("균열 서판" …) — 검색어와 겹치는 말이다
  const types =
    page === "tablet"
      ? `<h2>${esc(Object.keys(locales[lang].tablets).map((k) => locales[lang].bases[k]).join(" · "))}</h2>`
      : "";

  return `<h1>${esc(m.ldName)}</h1>
        <p>${esc(m.desc)}</p>
        <nav>${nav}</nav>
        ${types}
        <ul>${optionTexts(lang, page).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
}

const body = (lang, page) =>
  `<div id="root">
      <main style="${SR_ONLY}">
        ${shell(lang, page)}
      </main>
    </div>`;

// 같은 페이지끼리 서로를 가리킨다 — /waystone/의 짝은 /en/waystone/이다.
// x-default는 언어를 못 고른 크롤러가 갈 곳 — 그 페이지의 한국어판(루트 경로).
function alternates(page) {
  return LANGS.map(
    (l) =>
      `    <link rel="alternate" hreflang="${SEO[l].htmlLang}" href="${url(SEO[l].path, page)}" />`
  )
    .concat(`    <link rel="alternate" hreflang="x-default" href="${url("", page)}" />`)
    .join("\n");
}

function head(lang, page) {
  const s = SEO[lang];
  const m = meta(lang, page);
  const u = url(s.path, page);
  return `<title>${esc(m.title)}</title>
    <meta name="description" content="${esc(m.desc)}" />
    <link rel="canonical" href="${u}" />

${alternates(page)}

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${esc(s.siteName)}" />
    <meta property="og:locale" content="${s.ogLocale}" />
    <meta property="og:url" content="${u}" />
    <meta property="og:title" content="${esc(m.ogTitle)}" />
    <meta property="og:description" content="${esc(m.ogDesc)}" />
    <meta property="og:image" content="${ORIGIN}/og.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />

    <script type="application/ld+json">
      ${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: m.ldName,
        url: u,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        inLanguage: s.htmlLang,
        description: m.ldDesc,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        ...(page ? { isPartOf: { "@type": "WebApplication", url: url(s.path, null) } } : {}),
      })}
    </script>`;
}

const built = readFileSync("dist/index.html", "utf8");
const SEO_BLOCK = /<!--SEO-->[\s\S]*?<!--\/SEO-->/;
if (!SEO_BLOCK.test(built)) throw new Error("dist/index.html에 <!--SEO--> 마커가 없다");
// 조용히 빈 껍데기를 내보내지 않도록 — 마운트 지점이 바뀌면 정적 본문이 사라진다
if (!built.includes('<div id="root"></div>'))
  throw new Error('dist/index.html에 <div id="root"></div>가 없다 — 정적 본문을 못 넣는다');

for (const lang of LANGS) {
  const s = SEO[lang];
  for (const page of ROUTES) {
    const html = built
      .replace(/<html lang="[^"]*"/, `<html lang="${s.htmlLang}"`)
      .replace(SEO_BLOCK, head(lang, page))
      .replace('<div id="root"></div>', body(lang, page));

    const dir = "dist/" + [s.path, page].filter(Boolean).join("/");
    if (dir !== "dist") mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/index.html`, html);
  }
}

// 사이트맵 — 각 URL이 자기 hreflang 묶음을 들고 있어야 구글이 언어 짝을 인식한다.
// lastmod는 마지막 커밋 날짜다 — 빌드 시각을 쓰면 내용이 그대로여도 매번 바뀌어 크롤러가 헛걸음한다.
const lastmod = execSync('git log -1 --format="%cs"', { encoding: "utf8" }).trim();
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
  ROUTES.flatMap((page) =>
    LANGS.map((lang) => {
      const links = LANGS.map(
        (l) =>
          `    <xhtml:link rel="alternate" hreflang="${SEO[l].htmlLang}" href="${url(SEO[l].path, page)}"/>`
      )
        .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${url("", page)}"/>`)
        .join("\n");
      // 한국어가 대표(1.0), 탭 랜딩은 그 아래. 언어별 차등은 그대로 둔다.
      const priority = (lang === "kr" ? 1.0 : 0.8) - (page ? 0.1 : 0);
      return (
        `  <url>\n    <loc>${url(SEO[lang].path, page)}</loc>\n${links}\n` +
        `    <lastmod>${lastmod}</lastmod>\n` +
        `    <changefreq>weekly</changefreq>\n    <priority>${priority.toFixed(1)}</priority>\n  </url>`
      );
    })
  ).join("\n") +
  `\n</urlset>\n`;

writeFileSync("dist/sitemap.xml", sitemap);

console.log(`정적 HTML ${LANGS.length * ROUTES.length}개 (언어 ${LANGS.length} × 페이지 ${ROUTES.length}) + 사이트맵 생성`);
for (const lang of LANGS)
  console.log("  " + ROUTES.map((p) => url(SEO[lang].path, p).replace(ORIGIN, "")).join("  "));
