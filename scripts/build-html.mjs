// 언어별 정적 HTML + 사이트맵 생성 (vite build 뒤에 돈다).
//
//   node scripts/build-html.mjs      (npm run build이 자동으로 부른다)
//
// 왜 정적이어야 하는가 — 크롤러는 JS를 돌리기 전의 <head>를 본다. 앱 안에서 t()로 title을
// 바꿔 봐야 검색 결과에는 한국어 제목만 남는다. 그래서 언어마다 진짜 파일을 만든다:
//
//   dist/index.html        한국어 (루트 = x-default)
//   dist/en/index.html     영어
//   dist/ja/index.html     …
//
// 각 파일은 자기 언어의 title·description·og·JSON-LD를 갖고, hreflang으로 서로를 가리킨다.
// 파일이 실제로 있으므로 Firebase가 그대로 내려준다 (rewrite는 파일이 없을 때만 걸린다).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { LANG_PATH } from "../src/lib/langPath.js";

const ORIGIN = "https://poe2.cokeys90.dev";
const SEO = JSON.parse(readFileSync("scripts/data/seo.json", "utf8"));
const LANGS = Object.keys(SEO).filter((k) => !k.startsWith("_"));

// 앱이 아는 경로와 여기서 만드는 경로가 어긋나면 조용히 깨진다
// (크롤러가 본 /es/에 파일이 없거나, 앱이 /es/를 스페인어로 못 알아본다)
for (const lang of Object.keys(LANG_PATH)) {
  if (!SEO[lang]) throw new Error(`seo.json에 ${lang}이 없다`);
  if (SEO[lang].path !== LANG_PATH[lang])
    throw new Error(
      `${lang}: 경로 불일치 — seo.json="${SEO[lang].path}" vs langPath.js="${LANG_PATH[lang]}"`
    );
}
if (LANGS.length !== Object.keys(LANG_PATH).length)
  throw new Error("seo.json과 langPath.js의 언어 수가 다르다");

const url = (path) => `${ORIGIN}/${path ? path + "/" : ""}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/* ── 정적 본문 ───────────────────────────────────────────────────
   ⚠️ 이게 없으면 크롤러가 보는 <body>는 빈 <div id="root">뿐이다.
   구글은 JS를 실행해 주지만 2차 렌더링 큐라 늦고, 작은 사이트는 그 예산을 잘 못 받는다.
   네이버·빙·SNS 미리보기는 아예 JS를 안 돌린다 → 10개 언어가 전부 빈 껍데기로 색인된다.

   #root 안에 넣는다 — React가 마운트하면서 통째로 갈아치운다(앱 셸 폴백).
   숨기지 않는다. 숨기면 클로킹이고, 실제로 화면에 그 앱이 뜨므로 숨길 이유도 없다.

   내용은 **우리가 이미 가진 데이터**에서만 뽑는다: 그 언어의 서판 종류명·아이템 이름(poe2db 원문).
   지어내면 그 언어 사용자가 검색해서 들어왔을 때 화면과 다른 말이 적혀 있게 된다. */
const shell = (lang) => {
  const s = SEO[lang];
  const loc = JSON.parse(readFileSync(`src/data/locales/${lang}.json`, "utf8"));
  const types = Object.values(loc.tablets);
  const waystone = loc.bases.waystone.split(/[(（]/)[0].trim();

  return `<div id="root">
      <main>
        <h1>${esc(s.ldName)}</h1>
        <p>${esc(s.desc)}</p>
        <h2>${esc(waystone)}</h2>
        <h2>${esc(types.join(" · "))}</h2>
      </main>
    </div>`;
};

// 모든 언어가 서로를 가리킨다. x-default는 언어를 못 고른 크롤러가 갈 곳 — 루트(한국어).
const alternates = LANGS.map(
  (l) => `    <link rel="alternate" hreflang="${SEO[l].htmlLang}" href="${url(SEO[l].path)}" />`
)
  .concat(`    <link rel="alternate" hreflang="x-default" href="${url("")}" />`)
  .join("\n");

function head(lang) {
  const s = SEO[lang];
  const u = url(s.path);
  return `<title>${esc(s.title)}</title>
    <meta name="description" content="${esc(s.desc)}" />
    <link rel="canonical" href="${u}" />

${alternates}

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${esc(s.siteName)}" />
    <meta property="og:locale" content="${s.ogLocale}" />
    <meta property="og:url" content="${u}" />
    <meta property="og:title" content="${esc(s.ogTitle)}" />
    <meta property="og:description" content="${esc(s.ogDesc)}" />
    <meta property="og:image" content="${ORIGIN}/favicon.png" />
    <meta name="twitter:card" content="summary" />

    <script type="application/ld+json">
      ${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: s.ldName,
        url: u,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        inLanguage: s.htmlLang,
        description: s.ldDesc,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
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
  const html = built
    .replace(/<html lang="[^"]*"/, `<html lang="${s.htmlLang}"`)
    .replace(SEO_BLOCK, head(lang))
    .replace('<div id="root"></div>', shell(lang));

  const dir = s.path ? `dist/${s.path}` : "dist";
  if (s.path) mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/index.html`, html);
}

// 사이트맵 — 각 URL이 자기 hreflang 묶음을 들고 있어야 구글이 언어 짝을 인식한다
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
  LANGS.map((lang) => {
    const links = LANGS.map(
      (l) =>
        `    <xhtml:link rel="alternate" hreflang="${SEO[l].htmlLang}" href="${url(SEO[l].path)}"/>`
    )
      .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${url("")}"/>`)
      .join("\n");
    return (
      `  <url>\n    <loc>${url(SEO[lang].path)}</loc>\n${links}\n` +
      `    <changefreq>weekly</changefreq>\n    <priority>${lang === "kr" ? "1.0" : "0.8"}</priority>\n  </url>`
    );
  }).join("\n") +
  `\n</urlset>\n`;

writeFileSync("dist/sitemap.xml", sitemap);

console.log(`언어별 HTML ${LANGS.length}개 + 사이트맵 생성`);
console.log("  " + LANGS.map((l) => `/${SEO[l].path}` || "/").join("  "));
