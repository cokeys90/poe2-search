// 조각·원문·이름표를 합쳐 src/data/locales/{lang}.json 을 만든다. 파이프라인의 마지막 단계.
//
//   node scripts/scrape-poe2db.mjs && node scripts/scrape-tablet-types.mjs {각 언어}
//   node scripts/build-locales.mjs        # 원문 + 부가 옵션
//   node scripts/gen-frags.mjs            # 조각
//   node scripts/build-locale-files.mjs   # ← 여기
//
// ⚠️ 한국어(kr)는 덮어쓰지 않는다. 손으로 검증한 자산이고, 생성기가 그것과 같은 결과를 내는지
//    확인하는 기준점이기 때문이다 (`--force-kr`로 강제할 수 있다).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { CORE, TABLET_TYPES } from "../src/data/core.js";
import { LANGS } from "./langs.mjs";

const texts = JSON.parse(readFileSync("scripts/out/texts.json", "utf8"));
const extras = JSON.parse(readFileSync("scripts/out/extras.json", "utf8"));
const ingame = JSON.parse(readFileSync("scripts/data/ingame-waystone.json", "utf8"));
// 영어권 종류명 — 다른 언어의 제목이 이것과 같으면 "번역이 안 된 것"으로 본다
const usNames = JSON.parse(readFileSync("scripts/out/tablet-types-us.json", "utf8")).names;

// 기본 타입명에서 종류명만 뽑는다 ("Tablette d'Expédition" → "Expédition").
// 종류명은 화면의 종류 칩과 그룹 제목("Sufijos de {type}")에 들어간다 → **홀로 서는 명사**여야 한다.
// 연결어를 달고 오면 그룹 제목이 "Sufijos de del capataz"처럼 겹친다.
const CONNECTOR = /^(d'|de la |de |du |des |del |de |da |do |di )/i;
const fromBase = (base, stripWord) =>
  base
    .replace(stripWord, "")
    .replace(/\s+/g, " ")
    // 붙임표로 잇는 언어(독일어 "Aufseher-Tafel")는 떼어내면 하이픈이 남는다
    .replace(/^[\s\-–—]+|[\s\-–—]+$/g, "")
    .replace(CONNECTOR, "")
    .trim();

const forceKr = process.argv.includes("--force-kr");

// 옵션 키 전체 (코어 순서)
const KEYS = [
  ...CORE.waystone.implicit,
  ...CORE.waystone.prefix,
  ...CORE.waystone.suffix,
  ...CORE.tablet.prefix,
  ...CORE.tablet.suffix,
  ...TABLET_TYPES.flatMap((t) => [
    ...(CORE.tablet.implicit[t] || []),
    ...(CORE.tablet.unique[t] || []),
  ]),
].map((o) => o.key);

/* ── 값 뒤에 오는 단위 글자들 ─────────────────────────────────────
   piece()가 수치 뒤에 붙일 앵커다. 언어별로 실제 원문에서 뽑는다.
   %는 만국공통이고, CJK는 단일 글자 단위(회/個/次)를 쓴다.
   라틴·러시아어·태국어는 값 뒤에 단어가 오므로 단위 글자가 없다 → piece()가 \b를 쓴다. */
function unitsOf(lang) {
  const set = new Set();
  for (const k of KEYS) {
    const t = texts[k]?.[lang];
    if (!t) continue;
    const m = t.match(/\((-?\d+)[—–-](-?\d+)\)(.)/);
    if (!m) continue;
    const c = m[3];
    if (/[\p{L}\p{N}%]/u.test(c) && c !== " ") set.add(c);
  }
  return [...set].join("");
}

/* ── 서판 종류 이름 ─────────────────────────────────────────────
   방사능(irradiated)은 고유 모드가 없어 poe2db에 종류명 카드가 없다.
   두 기본 타입명의 최장 공통 부분문자열이 곧 그 언어의 "서판"이라는 말이므로, 그걸 빼면 남는다.
   ("Breach Tablet" vs "Irradiated Tablet" → " Tablet" → "Irradiated") */
function longestCommon(a, b) {
  const A = a.toLowerCase();
  const B = b.toLowerCase();
  let best = "";
  for (let i = 0; i < A.length; i++) {
    for (let j = i + best.length + 1; j <= A.length; j++) {
      const s = A.slice(i, j);
      if (B.includes(s) && s.length > best.length) best = s;
      else if (!B.includes(s)) break;
    }
  }
  return a.slice(A.indexOf(best), A.indexOf(best) + best.length);
}

const report = [];

for (const lang of LANGS) {
  const out = `src/data/locales/${lang}.json`;
  if (lang === "kr" && !forceKr && existsSync(out)) {
    report.push([lang, "건너뜀 (손검증 자산 — --force-kr로 덮어쓰기)"]);
    continue;
  }

  const frags = JSON.parse(readFileSync(`scripts/out/frags-${lang}.json`, "utf8"));
  const types = JSON.parse(readFileSync(`scripts/out/tablet-types-${lang}.json`, "utf8"));
  const ig = ingame[lang];
  if (!ig) throw new Error(`${lang}: 인게임 캡처 없음`);

  /* 옵션 */
  const options = {};
  for (const key of KEYS) {
    const text = texts[key]?.[lang];
    const f = frags[key];
    if (!text || !f) throw new Error(`${lang}: ${key} — ${!text ? "원문" : "조각"} 없음`);
    options[key] = { text, frag: f.frag, overlap: f.overlap };
    const ex = extras[key]?.[lang];
    if (ex?.length) options[key].extra = ex;
  }

  /* 서판 이름 */
  const tablets = {};
  const bases = {};
  const tabletWord = longestCommon(types.bases.breach, types.bases.irradiated);
  // 대소문자가 다를 수 있다 (러시아어: "Плитка Разлома" vs "Заражённая плитка")
  const stripWord = new RegExp(tabletWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  for (const slug of TABLET_TYPES) {
    bases[slug] = types.bases[slug];

    // ⚠️ poe2db 종류별 페이지의 제목(names)은 언어에 따라 영어가 그대로 남아 있다
    //    (th·fr·sp·pt의 Expedition·Delirium·Ritual). 영어권 제목과 똑같으면 번역 안 된 것으로
    //    보고 기본 타입명(bases)에서 유도한다 — bases는 거래소 API와 대조해 검증된 값이다
    //    (scripts/check-trade-bases.mjs). 독일어처럼 진짜로 영어와 같은 단어면 유도해도 같다.
    const name = types.names[slug];
    const untranslated = lang !== "us" && name != null && name === usNames[slug];
    tablets[slug] =
      name != null && !untranslated ? name : fromBase(types.bases[slug], stripWord);
  }
  bases.waystone = ig.waystoneBase;

  writeFileSync(
    out,
    JSON.stringify(
      {
        // 화면 그룹명은 UI 번역(우선순위 3)에서 채운다. 없으면 앱이 영어로 대체한다.
        tablets,
        bases,
        tokens: {
          tier: ig.tierSearch, // "{n}등급" / "Tier {n}" — 어순이 언어마다 다르다
          corrupted: ig.corrupted,
          units: unitsOf(lang),
        },
        options,
      },
      null,
      2
    ) + "\n"
  );

  report.push([
    lang,
    `옵션 ${Object.keys(options).length} · 단위 "${unitsOf(lang)}" · 서판 "${tablets.irradiated}" / "${tablets.breach}"`,
  ]);
}

console.log("생성한 로케일:");
for (const [l, msg] of report) console.log(`  ${l.padEnd(4)} ${msg}`);
