// 우리 서판 데이터 vs poe2db 종류별 페이지(= 실제로 붙을 수 있는 모드) 비교.
//
//   node scripts/scrape-tablet-types.mjs kr && node scripts/diff-tablets.mjs
//
// 버킷(공통접두 / 공통접미 / {종류}고유)별로 개수를 맞춰 보고, 모자란 버킷 안에서만 짝을 맞춘다.
// 첫 줄만으로 대조하면 안 된다 — 첫 줄이 같은 다른 모드가 있고(경로석 수량 3형제),
// 첫 줄이 페널티인 복합 모드도 있다(무리 규모 감소 + … + 금고 1개 추가).

import { readFileSync } from "node:fs";
import { DATA } from "../src/data/options.js";

const mods = JSON.parse(readFileSync("scripts/out/tablet-types-kr.json", "utf8"));

const norm = (t) =>
  t.replace(/\((-?\d+)[—–-](-?\d+)\)/g, "#").replace(/-?\d+/g, "#").replace(/\s+/g, " ").trim();

// 우리 옵션의 대조 열쇠: 작성자가 붙인 주석 "(무리 규모 감소, …)"은 떼고,
// " / "로 합쳐 적은 줄은 다시 나눠 전체 줄로 본다 (poe2db의 fold와 같은 형태).
const ourFold = (text) =>
  text
    .replace(/\s*\((?:무리 규모|경로석 수량)[^)]*\)\s*$/, "")
    .split(" / ")
    .map(norm)
    .join(" ¶ ");

const bucketOf = (m) => (m.types.length === 8 ? (m.gen === 1 ? "공통접두" : "공통접미") : m.types[0]);

const poe = new Map(); // 버킷 → [모드]
for (const m of mods) {
  const b = bucketOf(m);
  if (!poe.has(b)) poe.set(b, []);
  poe.get(b).push(m);
}

const ours = new Map();
const add = (b, list) => ours.set(b, list);
add("공통접두", DATA.tablet.prefix);
add("공통접미", DATA.tablet.suffix);
for (const [slug, list] of Object.entries(DATA.tablet.unique)) add(slug, list);

const BUCKETS = [...new Set([...poe.keys(), ...ours.keys()])];

console.log("버킷            poe2db  우리   차이");
for (const b of BUCKETS) {
  const p = (poe.get(b) || []).length;
  const o = (ours.get(b) || []).length;
  const d = p - o;
  console.log(`${b.padEnd(14)} ${String(p).padStart(5)} ${String(o).padStart(6)}   ${d ? (d > 0 ? "+" + d : d) : "·"}`);
}

console.log("\n═══ 모자란 버킷의 누락 모드");
for (const b of BUCKETS) {
  const p = poe.get(b) || [];
  const o = ours.get(b) || [];
  if (p.length <= o.length) continue;

  // 버킷 안에서 짝짓기 — poe2db의 fold(전체 줄) vs 우리 fold
  const taken = new Set();
  for (const it of o) {
    const want = ourFold(it.text);
    const i = p.findIndex(
      (m, idx) => !taken.has(idx) && m.lines.map(norm).join(" ¶ ") === want
    );
    if (i >= 0) taken.add(i);
  }
  const missing = p.filter((_, i) => !taken.has(i));
  console.log(`\n[${b}] 누락 ${missing.length}개`);
  for (const m of missing) {
    console.log(`  · ${m.lines.join("  ／  ")}`);
  }

  // 짝을 못 지은 우리 옵션(= 대조 실패)도 보여준다
  const orphan = o.filter((it) => {
    const want = ourFold(it.text);
    return !p.some((m) => m.lines.map(norm).join(" ¶ ") === want);
  });
  if (orphan.length) {
    console.log(`  (대조 실패한 우리 옵션 ${orphan.length}개 — 텍스트가 poe2db와 다름)`);
    for (const it of orphan) console.log(`    ? ${it.key} :: ${it.text}`);
  }
}
