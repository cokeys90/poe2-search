// poe2db 옵션 원문 수집기.
//
//   node scripts/scrape-poe2db.mjs kr us          # 특정 언어만
//   node scripts/scrape-poe2db.mjs                # 전체 11개 언어
//
// → scripts/out/raw-{lang}.json
//
// 수집 대상은 두 표뿐이다:
//   /{lang}/Waystones  의 "… Mods /107"  → 경로석 접두·접미 (티어별 행)
//   /{lang}/Tablet     의 "… Mods /83"   → 서판 전체      (티어별 행)
// 경로석 상단 6옵션(부활 횟수·아이템 희귀도 …)은 이 표에 없다 — 고정 6종이라 손으로 관리한다.
//
// 각 행 Description의 **첫 줄만** 실제 옵션이다(2번째 줄부터는 딸린 부가효과). CLAUDE.md §3-1.
// 언어 간 행 수와 순서가 동일하므로 인덱스로 정렬하고, 수치 시그니처로 교차검증한다.

import { writeFileSync, mkdirSync } from "node:fs";

// UI 라벨과 URL 코드가 다르다: PO→pt, ES→sp, English→us
export const LANGS = ["us", "kr", "jp", "cn", "tw", "ru", "pt", "th", "fr", "de", "sp"];
const UA = "poe2-search-i18n (+https://github.com/cokeys90/poe2-search)";

const PAGES = [
  { pool: "waystone", path: "Waystones" },
  { pool: "tablet", path: "Tablet" },
];

// "… Mods /N" 카드의 표 본문을 꺼낸다.
// 한 페이지에 Mods 표가 여럿이다(경로석: "Desecrated Waystone Mods /19" + "경로석 Mods /107").
// 우리가 쓰는 건 본편 모디파이어 표 = 그 중 행이 가장 많은 것.
function modsTable(html) {
  const re = /card-header[^>]*>([^<]*Mods\s*\/\s*(\d+)[^<]*)<\/h5>([\s\S]*?)<\/table>/g;
  const cands = [];
  let m;
  while ((m = re.exec(html))) {
    const rows = [...m[3].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((r) => r[1]);
    if (rows.length) cands.push({ label: m[1].trim(), declared: +m[2], rows });
  }
  if (!cands.length) return null;
  return cands.reduce((a, b) => (b.declared > a.declared ? b : a));
}

// 행 → { level, affix, text }. text는 Description 첫 줄, 값 범위는 원문 그대로 보존.
function parseRow(tr) {
  const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((t) => t[1]);
  if (tds.length < 3) return null;
  const firstLine = tds[2].split(/<br\s*\/?>/i)[0];
  const text = stripTags(firstLine);
  if (!text) return null;
  return { level: +stripTags(tds[0]) || 0, affix: stripTags(tds[1]), text };
}

function stripTags(s) {
  return s
    .replace(/<span class="ndash">\s*—\s*<\/span>/g, "—") // (5<span>—</span>9) → (5—9)
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// 정렬 교차검증용 시그니처 — 언어 불변인 것만 쓴다.
// 값 범위 "(5—9)"는 어느 언어에서도 숫자로 렌더된다. 반면 산문 속 낱개 숫자는 아니다:
// 영어는 "four additional Abysses"/"twice as likely"처럼 단어로 적고 한국어는 "4개"/"2배"로 적는다.
// → 범위만 본다. 여기에 언어 불변인 level 컬럼을 더해 강도를 보완.
export function numSig(text) {
  return [...text.matchAll(/\((-?\d+)[—–-](-?\d+)\)/g)].map((m) => m[1] + "~" + m[2]).join(",");
}

async function fetchPage(lang, path) {
  const url = `https://poe2db.tw/${lang}/${path}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

async function scrapeLang(lang) {
  const out = {};
  for (const { pool, path } of PAGES) {
    const html = await fetchPage(lang, path);
    const tbl = modsTable(html);
    if (!tbl) throw new Error(`${lang}/${path}: Mods 표를 못 찾음`);
    const rows = tbl.rows.map(parseRow).filter(Boolean);
    out[pool] = { label: tbl.label, declared: tbl.declared, rows };
    console.error(`  ${lang}/${path}: ${tbl.label} → 파싱 ${rows.length}행`);
  }
  return out;
}

const langs = process.argv.slice(2).length ? process.argv.slice(2) : LANGS;
mkdirSync("scripts/out", { recursive: true });

const all = {};
for (const lang of langs) {
  console.error(`[${lang}]`);
  all[lang] = await scrapeLang(lang);
  writeFileSync(`scripts/out/raw-${lang}.json`, JSON.stringify(all[lang], null, 1));
}

// 교차검증: 언어 간 행 수 + 수치 시그니처가 일치해야 인덱스 정렬이 성립한다.
const base = langs[0];
let bad = 0;
for (const pool of ["waystone", "tablet"]) {
  for (const lang of langs.slice(1)) {
    const a = all[base][pool].rows, b = all[lang][pool].rows;
    if (a.length !== b.length) {
      console.error(`✗ ${pool}: ${base}=${a.length}행 vs ${lang}=${b.length}행 — 정렬 불가`);
      bad++;
      continue;
    }
    const key = (r) => r.level + "|" + numSig(r.text);
    const mismatch = a.filter((r, i) => key(r) !== key(b[i])).length;
    if (mismatch) {
      console.error(`✗ ${pool}: ${base}↔${lang} 수치 시그니처 불일치 ${mismatch}/${a.length}행`);
      bad++;
    } else {
      console.error(`✓ ${pool}: ${base}↔${lang} ${a.length}행 정렬 OK`);
    }
  }
}
console.error(bad ? `\n실패 ${bad}건` : "\n전부 정렬 OK");
process.exit(bad ? 1 : 0);
