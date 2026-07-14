// 서판 종류별 페이지 수집 — 소속(공통/고유) · 고정 옵션 · 언어무관 식별자(ModFamilyList).
//
//   node scripts/scrape-tablet-types.mjs [lang]     (기본 kr)
//   → scripts/out/tablet-types-{lang}.json   { implicits:{slug:[줄…]}, mods:[…] }
//
// poe2db의 종류별 페이지(/{lang}/Breach_Tablet 등)에는 그 서판에 붙을 수 있는 모드 전체가
// JSON으로 박혀 있다(표는 JS로 렌더돼 HTML엔 없다). 그래서:
//   8개 종류 페이지 모두에 나오는 모드 = 공통
//   한 종류 페이지에만 나오는 모드     = 그 종류의 고유
// 종류를 사람이 추측하지 않고 이렇게 확정한다.
//
// ⚠️ 텍스트 소스로는 쓰지 말 것 — pt·th 페이지는 데이터가 빠져 있다(심연 us 33개 vs pt 23개).
//    옵션 원문은 통합표(scrape-poe2db.mjs)에서 가져온다. 이 스크립트는 소속·고정 옵션·식별자용이다.

import { writeFileSync } from "node:fs";

const UA = "poe2-search-i18n (+https://github.com/cokeys90/poe2-search)";

const PAGES = {
  breach: "Breach_Tablet",
  expedition: "Expedition_Tablet",
  delirium: "Delirium_Tablet",
  ritual: "Ritual_Tablet",
  overseer: "Overseer_Tablet",
  abyss: "Abyss_Tablet",
  temple: "Temple_Tablet",
  irradiated: "Irradiated_Tablet",
};

const strip = (s) =>
  s
    .replace(/\\"/g, '"')
    .replace(/\\\//g, "/")
    .replace(/<span class="ndash">\s*—\s*<\/span>/g, "—")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// 수치를 지운 형태 — 티어별 엔트리를 하나로 접는다
const norm = (t) =>
  t.replace(/\((-?\d+)[—–-](-?\d+)\)/g, "#").replace(/-?\d+/g, "#").replace(/\s+/g, " ").trim();

// 페이지 안의 "normal":[…] 배열을 통째로 JSON 파싱한다.
// 정규식으로 필드를 주워 담으면 엔트리 경계를 넘겨 짝이 어긋날 수 있다 — 조용히 틀린 데이터가 제일 위험하다.
function normalArray(html) {
  const at = html.indexOf('"normal":[');
  if (at < 0) return null;
  const start = html.indexOf("[", at);
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) return JSON.parse(html.slice(start, i + 1));
    }
  }
  return null;
}

// ModGenerationTypeID: 1=접두 2=접미 (그 밖은 고정 옵션 등 — 검색 대상이 아니다)
// str에는 딸린 부가 옵션 줄이 <br>로 이어진다.
function parseMods(html) {
  const arr = normalArray(html);
  if (!arr) return [];
  const out = [];
  for (const m of arr) {
    const gen = +m.ModGenerationTypeID;
    if (gen !== 1 && gen !== 2) continue;
    const lines = String(m.str || "").split(/<br\s*\/?>/i).map(strip).filter(Boolean);
    if (!lines.length) continue;
    // ModFamilyList는 언어 무관 식별자다 — 언어 간 같은 모드를 맞추는 유일한 열쇠.
    // (Name은 못 쓴다: 공통 모드에선 한국어 접사명이고, 이름 없는 모드에서만 내부명이 나온다.)
    out.push({ gen, family: (m.ModFamilyList || []).join(","), text: lines[0], lines });
  }
  return out;
}

// 서판의 고정 옵션 — 아이템 카드 헤더(2번째)에 들어 있다.
//   <span class='item_magic'>지도에 <a…>저세상 균열</a> 1개 추가<br/>잔여 사용 횟수 <span…>10</span>회</span>
// 두 줄이 <br>로 갈려 있다. 나머지 태그(키워드 링크·mod-value)는 지운다.
function implicitLines(html) {
  const heads = [...html.matchAll(/card-header[^>]*>([\s\S]*?)<\/h5>/g)];
  if (heads.length < 2) return null;
  return heads[1][1]
    .split(/<br\s*\/?>/i)
    .map(strip)
    .filter(Boolean);
}

// 카드 헤더에서 이름 두 개를 뽑는다.
//   1번 카드: "균열 서판 BreachAugment /8"  → 거래소 기본 타입명 ("균열 서판")
//   4번 카드: "균열"                        → 화면에 쓰는 종류 이름
function names(html) {
  const heads = [...html.matchAll(/card-header[^>]*>([\s\S]*?)<\/h5>/g)].map((m) => strip(m[1]));
  const base = heads[0]?.replace(/\s*\S*Augment\s*\/\s*\d+\s*$/, "").trim() || null;
  const name = heads[3]?.trim() || null;
  return { base, name };
}

const lang = process.argv[2] || "kr";
const implicits = {};
const bases = {};
const tabletNames = {};
const index = new Map();

for (const [slug, page] of Object.entries(PAGES)) {
  const res = await fetch(`https://poe2db.tw/${lang}/${page}`, { headers: { "User-Agent": UA } });
  if (!res.ok) {
    console.error(`✗ ${page} → HTTP ${res.status}`);
    continue;
  }
  const html = await res.text();
  implicits[slug] = implicitLines(html);
  const n = names(html);
  bases[slug] = n.base;
  tabletNames[slug] = n.name;
  const uniq = new Set();
  for (const m of parseMods(html)) {
    const k = m.lines.map(norm).join(" ¶ ");
    uniq.add(k);
    if (!index.has(k)) {
      index.set(k, { types: new Set(), gen: m.gen, family: m.family, text: m.text, lines: m.lines });
    }
    index.get(k).types.add(slug);
  }
  console.error(`  ${slug.padEnd(11)} 모드 ${uniq.size}개`);
}

const TOTAL = Object.keys(PAGES).length;
const mods = [...index.entries()].map(([k, v]) => ({
  norm: k,
  text: v.text,
  lines: v.lines,
  gen: v.gen, // 1=접두 2=접미
  family: v.family, // 언어 무관 식별자
  types: [...v.types],
}));

const common = mods.filter((r) => r.types.length === TOTAL);
const unique = mods.filter((r) => r.types.length === 1);
const partial = mods.filter((r) => r.types.length > 1 && r.types.length < TOTAL);

console.error(`\n공통(8종 전부) ${common.length}개 · 고유(1종) ${unique.length}개 · 애매(2~7종) ${partial.length}개`);
console.error(
  `  공통 접두 ${common.filter((r) => r.gen === 1).length} / 접미 ${common.filter((r) => r.gen === 2).length}`
);
for (const slug of Object.keys(PAGES)) {
  console.error(`  고유 ${slug.padEnd(11)} ${unique.filter((r) => r.types[0] === slug).length}개`);
}
if (partial.length) {
  console.error("\n⚠ 여러 종류에 걸친 모드 (공통도 고유도 아님):");
  for (const r of partial) console.error(`   [${r.types.join(",")}] ${r.text}`);
}

console.error("\n[이름]");
for (const slug of Object.keys(PAGES)) {
  console.error(`  ${slug.padEnd(11)} 타입명 "${bases[slug]}"   종류명 "${tabletNames[slug]}"`);
}

console.error("\n[고정 옵션]");
for (const [slug, t] of Object.entries(implicits)) {
  console.error(`  ${slug.padEnd(11)} ${t ? t.join("  /  ") : "✗ 못 찾음"}`);
}

writeFileSync(
  `scripts/out/tablet-types-${lang}.json`,
  JSON.stringify({ implicits, bases, names: tabletNames, mods }, null, 1)
);
console.error(`\n→ scripts/out/tablet-types-${lang}.json`);
