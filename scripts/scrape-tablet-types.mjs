// 서판 모드의 소속(공통 / 종류 고유)을 근거로 확정한다.
//
//   node scripts/scrape-tablet-types.mjs [lang]     (기본 kr)
//   → scripts/out/tablet-types-{lang}.json   { [정규화된 모드 텍스트]: { types:[…], gen, text } }
//
// poe2db의 종류별 페이지(/{lang}/Breach_Tablet 등)에는 그 서판에 붙을 수 있는 모드 전체가
// JSON으로 박혀 있다(표는 JS로 렌더돼 HTML엔 없다). 그래서:
//   8개 종류 페이지 모두에 나오는 모드 = 공통
//   한 종류 페이지에만 나오는 모드     = 그 종류의 고유
// 종류를 사람이 추측하지 않고 이렇게 확정한다.
//
// (JSON의 "Name"은 언어 무관 ID가 아니다 — 공통 모드에선 한국어 접사명("도전자의")이고
//  이름 없는 모드에서만 내부명(TowerIncursionPackSize)이 나온다.)

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
// str에는 딸린 부가효과 줄이 <br>로 이어진다 — 첫 줄만 실제 옵션이다.
function parseMods(html) {
  const arr = normalArray(html);
  if (!arr) return [];
  const out = [];
  for (const m of arr) {
    const gen = +m.ModGenerationTypeID;
    if (gen !== 1 && gen !== 2) continue;
    const lines = String(m.str || "").split(/<br\s*\/?>/i).map(strip).filter(Boolean);
    if (!lines.length) continue;
    out.push({ gen, name: m.Name, text: lines[0], lines });
  }
  return out;
}

const lang = process.argv[2] || "kr";
const index = new Map(); // 정규화 텍스트 → { types:Set, gen, text }

for (const [slug, page] of Object.entries(PAGES)) {
  const res = await fetch(`https://poe2db.tw/${lang}/${page}`, { headers: { "User-Agent": UA } });
  if (!res.ok) {
    console.error(`✗ ${page} → HTTP ${res.status}`);
    continue;
  }
  const mods = parseMods(await res.text());
  const uniq = new Set();
  for (const m of mods) {
    const k = m.lines.map(norm).join(" ¶ ");
    uniq.add(k);
    if (!index.has(k)) index.set(k, { types: new Set(), gen: m.gen, text: m.text, lines: m.lines });
    index.get(k).types.add(slug);
  }
  console.error(`  ${slug.padEnd(11)} 모드 ${uniq.size}개`);
}

const TOTAL = Object.keys(PAGES).length;
const rows = [...index.entries()].map(([k, v]) => ({
  norm: k,
  text: v.text,
  lines: v.lines,
  gen: v.gen, // 1=접두 2=접미
  types: [...v.types],
}));

const common = rows.filter((r) => r.types.length === TOTAL);
const unique = rows.filter((r) => r.types.length === 1);
const partial = rows.filter((r) => r.types.length > 1 && r.types.length < TOTAL);

console.error(`\n공통(8종 전부) ${common.length}개 · 고유(1종) ${unique.length}개 · 애매(2~7종) ${partial.length}개`);
console.error(
  `  공통 접두 ${common.filter((r) => r.gen === 1).length} / 접미 ${common.filter((r) => r.gen === 2).length}`
);
for (const slug of Object.keys(PAGES)) {
  const n = unique.filter((r) => r.types[0] === slug).length;
  console.error(`  고유 ${slug.padEnd(11)} ${n}개`);
}
if (partial.length) {
  console.error("\n⚠ 여러 종류에 걸친 모드 (공통도 고유도 아님):");
  for (const r of partial) console.error(`   [${r.types.join(",")}] ${r.text}`);
}

writeFileSync(
  `scripts/out/tablet-types-${lang}.json`,
  JSON.stringify(rows, null, 1)
);
console.error(`\n→ scripts/out/tablet-types-${lang}.json`);
