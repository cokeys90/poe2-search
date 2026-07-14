// 안정키(key) 후보 생성 — 검토용 표를 낸다. 실제 파일은 손으로 확정한다.
//
//   node scripts/gen-keys.mjs            # 표 출력
//   node scripts/gen-keys.mjs --json     # scripts/out/keys.json
//
// DATA(한국어) 옵션을 poe2db kr 수집본에 붙여 같은 행의 us 원문을 얻고, 영어 단어로 슬러그를 만든다.
// 한국어 원문의 수치는 티어마다 다르므로 숫자를 #로 지운 뒤 대조한다.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { DATA, TABLET_META } from "./legacy/options-pre-i18n.js";

const kr = JSON.parse(readFileSync("scripts/out/raw-kr.json", "utf8"));
const us = JSON.parse(readFileSync("scripts/out/raw-us.json", "utf8"));

// 수치를 지운 형태 — 티어별 행을 하나로 묶는 열쇠
const norm = (t) =>
  t.replace(/\((-?\d+)[—–-](-?\d+)\)/g, "#").replace(/\d+/g, "#").replace(/\s+/g, " ").trim();

// kr 정규화문 → us 원문 (첫 티어 것)
const krToUs = new Map();
for (const pool of ["waystone", "tablet"]) {
  kr[pool].rows.forEach((r, i) => {
    const k = norm(r.text);
    if (!krToUs.has(k)) krToUs.set(k, us[pool].rows[i].text);
  });
}

// 경로석 상단 6옵션은 Mods 표에 없다(고정 6종) — 손으로 못 박는다.
const IMPLICIT_SLUGS = {
  "부활 횟수": "revives",
  "아이템 희귀도": "item_rarity",
  "무리 규모": "pack_size",
  "몬스터 희귀도": "rare_monsters",
  "경로석 출현 확률": "waystone_chance",
  "몬스터 효율": "monster_effect",
};

const STOP = new Set(
  ("a an the of in to from with your you and or have has are is be as at on for" +
    " map maps area additional increased more chance level levels" +
    " players player their this that all each one two twice per").split(/\s+/)
);

function words(en) {
  const w = en
    .toLowerCase()
    .replace(/\(-?\d+[—–-]-?\d+\)/g, " ")
    .replace(/[^a-z ]/g, " ")
    .split(/\s+/)
    .filter((x) => x.length > 2 && !STOP.has(x));
  return [...new Set(w)]; // 중복 제거 ("damage as extra fire damage" → damage, extra, fire)
}

// 슬러그는 같은 풀 안에서 그 옵션을 알아볼 수 있어야 한다.
// 풀에서 흔한 단어(damage, monsters …)는 변별력이 없으니 버리고 희소한 단어를 남긴다.
// (frag 설계 철학과 같다 — 고유성 우선.)
function slugifyPool(items) {
  const docs = items.map((en) => (en ? words(en) : []));
  const df = new Map();
  for (const d of docs) for (const w of d) df.set(w, (df.get(w) || 0) + 1);
  const common = (w) => df.get(w) / docs.length > 0.4; // 풀의 40% 넘게 나오면 흔한 말

  return docs.map((d) => {
    if (!d.length) return null;
    let cand = d.filter((w) => !common(w));
    if (!cand.length) cand = d; // 전부 흔하면 어쩔 수 없이 원래대로
    // 희소한 순으로 3개 고르되, 원문 어순은 지킨다 (읽기 좋게)
    const top = [...cand].sort((a, b) => df.get(a) - df.get(b)).slice(0, 3);
    return d.filter((w) => top.includes(w)).join("_");
  });
}

// poe2db 표에서 자동으로 못 붙는 5개.
// · tb.pre 3개: 첫 줄("경로석 수량 증가")이 서로 같고 둘째 줄이 다른 모드 —
//   그래서 stat_id도 셋이 같다. 원작성자가 둘째 줄을 text에 넣어 구분했다.
// · tb.suf 2개: 원문 뒤에 작성자 주석 "(무리 규모 감소, …)"이 붙어 대조가 어긋난다.
const MANUAL = {
  "지도에 에센스 1개 추가 등장 / 지도에서 발견하는 경로석 수량 % 증가": "waystones_essences",
  "지도에서 발견하는 경로석 수량 % 증가 / 지도에 아즈메리 혼백 1개 추가 등장": "waystones_azmeri_spirits",
  "지도에서 발견하는 경로석 수량 % 증가 / 지도에 탈주 유배자 추가 1명이 서식": "waystones_rogue_exiles",
  "지도에 성소가 등장할 확률 #% 증가 (무리 규모 감소, 경로석 수량 증가, 성소 추가)": "contain_shrines",
  "지도에 금고가 등장할 확률 #% 증가 (무리 규모 감소, 경로석 수량 증가, 금고 추가)": "contain_strongboxes",
  // 자동 슬러그가 너무 막연해 손으로 다듬은 것 (키는 영구불변이라 읽히게 둔다)
  "몬스터 피해 (5—9)% 증가": "monster_damage",
  "지도에 심연 1개 추가 등장": "contains_abyss",
};

const rows = [];
const pools = [
  ["ws.imp", DATA.waystone.implicit],
  ["ws.pre", DATA.waystone.prefix],
  ["ws.suf", DATA.waystone.suffix],
  ["tb.pre", DATA.tablet.common_prefix],
  ["tb.suf", DATA.tablet.common_suffix],
];
// 서판 종류는 TABLET_META의 slug를 쓴다 (균열→breach …). 키에 한국어가 들어가면 안 된다.
for (const [type, items] of Object.entries(DATA.tablet.unique)) {
  pools.push(["tb." + TABLET_META[type].slug, items]);
}

const used = new Set();
for (const [prefix, items] of pools) {
  const ens = items.map((it) => krToUs.get(norm(it.text)) || null);
  const slugs = slugifyPool(ens);
  items.forEach((it, i) => {
    const en = ens[i];
    let base =
      prefix === "ws.imp" ? IMPLICIT_SLUGS[it.text] : MANUAL[it.text] || slugs[i] || "TODO";
    let key = `${prefix}.${base}`;
    let n = 2;
    while (used.has(key)) key = `${prefix}.${base}_${n++}`; // 같은 풀 내 충돌만 번호
    used.add(key);
    rows.push({ key, pool: prefix, kr: it.text, en, stat_id: it.stat_id || null });
  });
}

const missing = rows.filter((r) => !r.en && r.pool !== "ws.imp");
if (process.argv.includes("--json")) {
  mkdirSync("scripts/out", { recursive: true });
  writeFileSync("scripts/out/keys.json", JSON.stringify(rows, null, 1));
  console.error(`총 ${rows.length}개 · 영어 원문 못 붙인 것 ${missing.length}개`);
} else {
  for (const r of rows) console.log([r.key, r.kr, r.en ?? "—"].join("\t"));
  console.error(`\n총 ${rows.length}개 · 영어 원문 못 붙인 것 ${missing.length}개`);
  for (const r of missing) console.error("  ✗ " + r.pool + " :: " + r.kr);
}
