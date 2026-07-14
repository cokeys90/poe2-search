// poe2db 수집본(raw-*.json) → 우리 115개 옵션의 11개 언어 원문.
//
//   node scripts/scrape-poe2db.mjs && node scripts/build-locales.mjs
//   → scripts/out/texts.json  { [key]: { us, kr, jp, … } }
//
// ── 정렬을 행 인덱스로 하면 안 된다 ──────────────────────────────
// poe2db는 같은 모드의 티어를 여러 행으로 보여주는데, 그 행 수가 언어마다 다르다.
// (pt 경로석은 중독 4티어를 값 없는 1행으로 뭉쳤다 → 107행 vs 104행)
// 대신 "설명 전체를 수치만 지운 형태"로 티어를 접어 고유 모드 목록을 만들면
// 11개 언어가 정확히 같은 개수·같은 순서가 된다(경로석 35 / 서판 83). 그 순서로 맞춘다.

import { readFileSync, writeFileSync } from "node:fs";
import { DATA } from "../src/data/options.js";
import { LANGS } from "./langs.mjs";

const raw = Object.fromEntries(
  LANGS.map((l) => [l, JSON.parse(readFileSync(`scripts/out/raw-${l}.json`, "utf8"))])
);

// 수치를 지운 형태 — 티어 행을 하나로 접는 열쇠
const norm = (t) =>
  t.replace(/\((-?\d+)[—–-](-?\d+)\)/g, "#").replace(/-?\d+/g, "#").replace(/\s+/g, " ").trim();
// 설명 '전체 줄'로 접는다. 첫 줄만 쓰면 첫 줄이 같고 둘째 줄만 다른 모드가 뭉개진다.
const fold = (r) => (r.lines || [r.text]).map(norm).join(" ¶ ");

// 언어별·풀별 고유 모드 목록 (등장 순서 유지). 티어가 여럿이면 첫 행(가장 낮은 티어)의 원문을 쓴다.
function distinct(lang, pool) {
  const seen = new Map();
  for (const r of raw[lang][pool].rows) {
    if (!r.text) continue;
    const k = fold(r);
    if (!seen.has(k)) seen.set(k, r);
  }
  return [...seen.values()];
}

// 표시할 원문 한 줄.
// 보통은 설명의 첫 줄이지만, 첫 줄이 다른 모드와 똑같은 경우가 있다
// (서판 접두 3종: "경로석 수량 증가"가 첫 줄이고 둘째 줄만 아즈메리/유배자로 다르다).
// 그대로 두면 화면에서 구분이 안 되므로 그때만 줄을 합친다 — 기존 한국어 데이터가 쓰던 방식.
function displayText(mods, r) {
  const dupes = mods.filter((m) => m.text === r.text).length;
  return dupes > 1 ? (r.lines || [r.text]).join(" / ") : r.text;
}

const MODS = {};
for (const pool of ["waystone", "tablet"]) {
  MODS[pool] = Object.fromEntries(LANGS.map((l) => [l, distinct(l, pool)]));
  const sizes = LANGS.map((l) => MODS[pool][l].length);
  if (new Set(sizes).size !== 1) {
    console.error(`✗ ${pool}: 언어별 고유 모드 수가 다르다 → 정렬 불가`);
    console.error("  " + LANGS.map((l, i) => `${l}=${sizes[i]}`).join(" "));
    process.exit(1);
  }
  console.error(`✓ ${pool}: 고유 모드 ${sizes[0]}개 — 11개 언어 모두 동일`);
}

// ── 우리 옵션 → kr 고유 모드 인덱스 ─────────────────────────────
// 우리 text는 poe2db 원문 그대로가 아닌 경우가 있다:
//  · 첫 줄이 같고 둘째 줄만 다른 서판 접두 3종 → 작성자가 " / "로 두 줄을 합쳐 적었다
//  · 성소·금고 접미 2종 → 뒤에 "(무리 규모 감소, …)" 주석이 붙었다
// 그래서 우리 text를 그대로 대조하지 않고, 그 옵션을 특정하는 '조각'으로 kr 행을 찾는다.
const krMods = { waystone: MODS.waystone.kr, tablet: MODS.tablet.kr };

// 대조 실패분은 손으로 못 박는다. 값: 그 옵션을 유일하게 특정하는 kr 원문 조각.
const MANUAL = {
  "tb.pre.waystones_essences": "지도에 에센스 1개 추가 등장",
  "tb.pre.waystones_azmeri_spirits": "지도에 아즈메리 혼백 1개 추가 등장",
  "tb.pre.waystones_rogue_exiles": "지도에 탈주 유배자 추가 1명이 서식",
  "tb.suf.contain_shrines": "지도에 성소가 등장할 확률",
  "tb.suf.contain_strongboxes": "지도에 금고가 등장할 확률",
};

// 접두/접미로 후보를 가른다. 수치를 지우면 같아지는 서로 다른 모드가 있기 때문이다:
//   "지도에 에센스 1개 추가 등장"(접두)  vs  "지도에 에센스 (1—2)개 추가 등장"(감독관 고유 접미)
// 둘 다 "지도에 에센스 #개 추가 등장"이 된다. poe2db 행의 Pre/Suf 컬럼이 이걸 갈라 준다.
// 그래도 후보가 여럿이면 조용히 첫 번째를 집지 말고 실패시킨다 — 틀린 정렬이 제일 위험하다.
function findKr(pool, affix, key, text) {
  const mods = krMods[pool].filter((m) => m.affix === affix);
  const hits = MANUAL[key]
    ? mods.filter((m) => (m.lines || [m.text]).some((l) => l.includes(MANUAL[key])))
    : mods.filter((m) => norm(m.text) === norm(text));
  if (hits.length !== 1) return { i: -1, why: hits.length ? `후보 ${hits.length}개` : "후보 없음" };
  return { i: krMods[pool].indexOf(hits[0]), why: null };
}

const ours = [
  ...DATA.waystone.prefix.map((it) => ["waystone", "접두어", it]),
  ...DATA.waystone.suffix.map((it) => ["waystone", "접미어", it]),
  ...DATA.tablet.prefix.map((it) => ["tablet", "접두어", it]),
  ...DATA.tablet.suffix.map((it) => ["tablet", "접미어", it]),
  ...Object.values(DATA.tablet.unique).flat().map((it) => ["tablet", "접미어", it]),
];

const texts = {};
const unmatched = [];
for (const [pool, affix, it] of ours) {
  const { i, why } = findKr(pool, affix, it.key, it.text);
  if (i < 0) {
    unmatched.push(`${it.key} (${why}) :: ${it.text}`);
    continue;
  }
  texts[it.key] = Object.fromEntries(
    LANGS.map((l) => [l, displayText(MODS[pool][l], MODS[pool][l][i])])
  );
}

// 경로석 상단 6옵션은 Mods 표에 없다(고정 6종) — 손으로 채워야 한다.
const IMPLICIT = DATA.waystone.implicit.map((it) => it.key);

console.error(`\n대조 완료: ${Object.keys(texts).length}/${ours.length}개`);
if (unmatched.length) {
  console.error(`✗ 대조 실패 ${unmatched.length}개:`);
  for (const u of unmatched) console.error("  " + u);
}
console.error(`⚠ 경로석 상단 6옵션(${IMPLICIT.join(", ")})은 표에 없어 손으로 채워야 한다.`);

writeFileSync("scripts/out/texts.json", JSON.stringify(texts, null, 1));
console.error("\n→ scripts/out/texts.json");

// 눈으로 볼 샘플
const sample = Object.keys(texts)[0];
console.error(`\n[샘플] ${sample}`);
for (const l of LANGS) console.error(`  ${l}: ${texts[sample][l]}`);
process.exit(unmatched.length ? 1 : 0);
