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
// 각 행 Description의 첫 줄만 실제 옵션이다(2번째 줄부터는 딸린 부가효과). CLAUDE.md §3-1.
// 단, 첫 줄이 같고 둘째 줄만 다른 모드가 있어(서판 접두 3종) lines에 전체 줄을 남긴다.

import { writeFileSync, mkdirSync } from "node:fs";
import { LANGS } from "./langs.mjs";

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

// 행 → { level, affix, text, lines }. text는 Description 첫 줄, 값 범위는 원문 그대로 보존.
//
// ⚠️ 설명이 빈 행도 버리지 않는다(text: ""). 언어별로 번역이 빠진 행이 있어서(pt 경로석 3행),
// 버리면 행 수가 달라져 언어 간 인덱스 정렬이 통째로 밀린다. 자리는 지키고 내용만 비워 둔다.
function parseRow(tr) {
  const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((t) => t[1]);
  if (tds.length < 3) return null; // 헤더(th)만 걸러낸다
  const lines = tds[2].split(/<br\s*\/?>/i).map(stripTags).filter(Boolean);
  return {
    level: +stripTags(tds[0]) || 0,
    affix: stripTags(tds[1]),
    text: lines[0] || "",
    lines, // 첫 줄이 같고 둘째 줄만 다른 모드가 있다(서판 접두 3종) → 둘째 줄 이하도 남긴다
  };
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

/* ---------- 수집 보고 ----------
   언어 간 정렬은 여기서 하지 않는다. 행 인덱스로는 맞출 수 없기 때문이다:
   poe2db는 한 모드의 티어를 여러 행으로 보여주는데 그 행 수가 언어마다 다르다.
   (pt 경로석은 중독 4티어를 값 없는 1행으로 뭉쳐 107행이 아니라 104행이다.)
   정렬은 티어를 접어 '고유 모드' 단위로 build-locales.mjs가 한다.
   여기서는 수집 상태와 데이터 품질만 보고한다. */
console.error("\n[수집 결과]");
for (const lang of langs) {
  const w = all[lang].waystone.rows.length;
  const t = all[lang].tablet.rows.length;
  console.error(`  ${lang.padEnd(3)} 경로석 ${String(w).padStart(3)}행 · 서판 ${String(t).padStart(3)}행`);
}

// 품질 신호 — 3단계(조각 생성) 전에 사람이 봐야 하는 것들
console.error("\n[데이터 품질]");
const RAW_STAT = /^[a-z_]+( [a-z_+%\[\],0-9-]+)+$/; // 번역 누락 시 원시 스탯 문자열이 그대로 나온다
for (const lang of langs) {
  const rows = [...all[lang].waystone.rows, ...all[lang].tablet.rows];
  const empty = rows.filter((r) => !r.text).length;
  const noRange = rows.filter((r) => r.text && !numSig(r.text)).length;
  const raw = rows.filter((r) => r.text && RAW_STAT.test(r.text)).map((r) => r.text);
  const flags = [];
  if (empty) flags.push(`빈 행 ${empty}`);
  if (raw.length) flags.push(`번역 누락 ${raw.length}`);
  console.error(
    `  ${lang.padEnd(3)} 범위 없는 행 ${String(noRange).padStart(3)}/${rows.length}` +
      (flags.length ? `  ⚠ ${flags.join(" · ")}` : "")
  );
  for (const t of raw) console.error(`        ↳ ${t}`);
}

console.error("\n수집 완료 → scripts/out/raw-{lang}.json   (정렬은 build-locales.mjs가 한다)");
