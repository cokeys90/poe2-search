// 여러 줄짜리 모드 전수 조사 — "실제 옵션 줄"과 "딸려 붙는 부가효과 줄"을 가려내기 위한 것.
//
//   node scripts/audit-multiline.mjs
//
// poe2db의 모드 하나가 여러 줄인 경우가 있다. 그중 하나가 그 옵션의 정체이고
// 나머지는 그 옵션이 붙으면 따라오는 부가효과다(CLAUDE.md §3-1).
// 우리 데이터가 어느 줄을 text로 쓰고 있는지 나란히 보여준다.

import { readFileSync } from "node:fs";
import { DATA } from "../src/data/options.js";

const kr = JSON.parse(readFileSync("scripts/out/raw-kr.json", "utf8"));
const types = JSON.parse(readFileSync("scripts/out/tablet-types-kr.json", "utf8"));

const norm = (t) =>
  t.replace(/\((-?\d+)[—–-](-?\d+)\)/g, "#").replace(/-?\d+/g, "#").replace(/\s+/g, " ").trim();

// 우리 옵션: 어떤 줄을 text로 쓰는가
const ours = [
  ...DATA.waystone.prefix.map((it) => ["경로석 접두", it]),
  ...DATA.waystone.suffix.map((it) => ["경로석 접미", it]),
  ...DATA.tablet.prefix.map((it) => ["서판 공통접두", it]),
  ...DATA.tablet.suffix.map((it) => ["서판 공통접미", it]),
  ...Object.entries(DATA.tablet.unique).flatMap(([slug, list]) =>
    list.map((it) => [`서판 ${slug}`, it])
  ),
];
const ourLines = new Map(); // 정규화된 줄 → [우리 옵션]
for (const [grp, it] of ours) {
  for (const line of it.text.split(" / ")) {
    const k = norm(line);
    if (!ourLines.has(k)) ourLines.set(k, []);
    ourLines.get(k).push({ grp, key: it.key });
  }
}

// poe2db의 여러 줄 모드 (경로석 통합표 + 서판 종류별 페이지)
const multi = [];
for (const r of kr.waystone.rows) {
  if (r.lines?.length > 1) multi.push({ src: "경로석", lines: r.lines });
}
for (const r of types) {
  if (r.lines?.length > 1) {
    multi.push({ src: r.types.length === 8 ? "서판 공통" : `서판 ${r.types[0]}`, lines: r.lines });
  }
}

// 같은 모드가 티어별로 여러 번 나오므로 접는다
const seen = new Set();
const uniq = multi.filter((m) => {
  const k = m.lines.map(norm).join(" ¶ ");
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

console.log(`여러 줄짜리 모드 ${uniq.length}개\n`);
for (const m of uniq) {
  console.log(`[${m.src}]`);
  for (const line of m.lines) {
    const hit = ourLines.get(norm(line));
    const mark = hit ? `  ← 우리 text: ${hit.map((h) => h.key).join(", ")}` : "";
    console.log(`   · ${line}${mark}`);
  }
  console.log();
}
