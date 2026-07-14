// poe2db에는 있는데 우리 데이터엔 없는 모드를 찾는다.
//
//   node scripts/find-missing.mjs
//
// build-locales와 같은 방식으로 짝을 짓고(고유 모드 단위 + 접두/접미 판별),
// 짝이 없는 poe2db 모드를 남긴다.

import { readFileSync } from "node:fs";
import { DATA } from "../src/data/options.js";

const kr = JSON.parse(readFileSync("scripts/out/raw-kr.json", "utf8"));
const us = JSON.parse(readFileSync("scripts/out/raw-us.json", "utf8"));

const norm = (t) =>
  t.replace(/\((-?\d+)[—–-](-?\d+)\)/g, "#").replace(/-?\d+/g, "#").replace(/\s+/g, " ").trim();
const fold = (r) => (r.lines || [r.text]).map(norm).join(" ¶ ");

function distinct(src, pool) {
  const seen = new Map();
  src[pool].rows.forEach((r, i) => {
    if (!r.text) return;
    const k = fold(r);
    if (!seen.has(k)) seen.set(k, { ...r, row: i });
  });
  return [...seen.values()];
}

// 우리 옵션이 차지한 모드에 표시를 남긴다 (build-locales의 findKr과 같은 규칙)
const MANUAL = {
  "tb.pre.waystones_essences": "지도에 에센스 1개 추가 등장",
  "tb.pre.waystones_azmeri_spirits": "지도에 아즈메리 혼백 1개 추가 등장",
  "tb.pre.waystones_rogue_exiles": "지도에 탈주 유배자 추가 1명이 서식",
  "tb.suf.contain_shrines": "지도에 성소가 등장할 확률",
  "tb.suf.contain_strongboxes": "지도에 금고가 등장할 확률",
};

for (const pool of ["waystone", "tablet"]) {
  const krMods = distinct(kr, pool);
  const usMods = distinct(us, pool);
  const taken = new Set();

  const ours =
    pool === "waystone"
      ? [
          ...DATA.waystone.prefix.map((it) => ["접두어", it]),
          ...DATA.waystone.suffix.map((it) => ["접미어", it]),
        ]
      : [
          ...DATA.tablet.prefix.map((it) => ["접두어", it]),
          ...DATA.tablet.suffix.map((it) => ["접미어", it]),
          ...Object.values(DATA.tablet.unique).flat().map((it) => ["접미어", it]),
        ];

  for (const [affix, it] of ours) {
    const cands = krMods.filter((m) => m.affix === affix);
    const hits = MANUAL[it.key]
      ? cands.filter((m) => (m.lines || [m.text]).some((l) => l.includes(MANUAL[it.key])))
      : cands.filter((m) => norm(m.text) === norm(it.text));
    if (hits.length === 1) taken.add(krMods.indexOf(hits[0]));
  }

  const missing = krMods.map((m, i) => [m, i]).filter(([, i]) => !taken.has(i));
  console.log(`\n═══ ${pool}: poe2db ${krMods.length}개 · 우리 ${ours.length}개 · 짝 없는 것 ${missing.length}개`);
  for (const [m, i] of missing) {
    console.log(`\n  [${m.affix}] ${m.text}`);
    console.log(`     us: ${usMods[i]?.text ?? "?"}`);
    if (m.lines.length > 1) console.log(`     (딸린 줄: ${m.lines.slice(1).join(" / ")})`);
  }
}
