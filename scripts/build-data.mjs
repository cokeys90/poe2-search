// options.js(한국어 뭉치)를 언어무관 코어 + 한국어 로케일로 쪼갠다. 1회성 마이그레이션.
//
//   node scripts/gen-keys.mjs --json && node scripts/build-data.mjs
//
// 생성물 (이후로는 이 파일들이 원본이고, options.js는 지운다):
//   src/data/core.js          언어무관 — key, 수치 성격, stat_id, map_filter
//   src/data/locales/kr.json  한국어 — text, frag, overlap, trade + 그룹·종류·거래소 타입명·정규식 토큰
//   src/data/legacyIdMap.js   옛 optId(한국어 해시) → key. localStorage 1회 이관용
//
// 언어무관/언어별 필드 구분:
//   무관 numeric openMax rmin rmax noPercent map_filter stat_id
//   언어 text frag overlap trade      ← overlap도 언어별이다(조각의 고유성은 언어마다 다르다)

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { DATA, TABLET_META, TABLET_TYPES } from "./legacy/options-pre-i18n.js";
import { optId } from "./legacy/optid.mjs";

const keys = JSON.parse(readFileSync("scripts/out/keys.json", "utf8"));

// keys.json은 DATA 순회 순서 그대로다 — 같은 순서로 다시 돌며 짝을 짓는다.
const pools = [
  ["waystone", "implicit", DATA.waystone.implicit],
  ["waystone", "prefix", DATA.waystone.prefix],
  ["waystone", "suffix", DATA.waystone.suffix],
  ["tablet", "prefix", DATA.tablet.common_prefix],
  ["tablet", "suffix", DATA.tablet.common_suffix],
];
for (const [type, items] of Object.entries(DATA.tablet.unique)) {
  pools.push(["tablet", "unique:" + TABLET_META[type].slug, items]);
}

const CORE = { waystone: {}, tablet: { unique: {} } };
const L10N = {};
const LEGACY = {};
let cursor = 0;

const CORE_FIELDS = ["numeric", "openMax", "rmin", "rmax", "noPercent", "map_filter", "stat_id"];

for (const [item, group, items] of pools) {
  const out = [];
  for (const it of items) {
    const row = keys[cursor++];
    if (row.kr !== it.text) throw new Error(`키 정렬 어긋남 @${cursor}: ${row.kr} ≠ ${it.text}`);

    const core = { key: row.key };
    for (const f of CORE_FIELDS) if (it[f] !== undefined) core[f] = it[f];
    out.push(core);

    const loc = { text: it.text, frag: it.frag, overlap: it.overlap };
    if (it.trade !== undefined) loc.trade = it.trade;
    L10N[row.key] = loc;

    LEGACY[optId(it.text)] = row.key;
  }
  if (group.startsWith("unique:")) CORE.tablet.unique[group.slice(7)] = out;
  else CORE[item][group] = out;
}
if (cursor !== keys.length) throw new Error(`옵션 수 불일치: ${cursor} vs ${keys.length}`);

// 방사능은 고유 옵션이 없어 DATA.tablet.unique에 빈 배열로 있다 — 코어에도 유지 (noUnique 판정 근거)
for (const t of TABLET_TYPES) {
  const slug = TABLET_META[t].slug;
  if (!CORE.tablet.unique[slug]) CORE.tablet.unique[slug] = [];
}

/* ---------- core.js ---------- */
const meta = {};
for (const [ko, m] of Object.entries(TABLET_META)) {
  meta[m.slug] = { color: m.color, glow: m.glow, implicit: m.implicit };
}
const coreJs = `// PoE2 경로석·서판 옵션 — 언어무관 코어 (poe2db 검증, 0.5.x)
// 표시 텍스트·검색조각·거래소명은 언어별로 src/data/locales/{lang}.json 에 있다. key로 잇는다.
// 경로석: 옵션(상단 6종) / 접두(15) / 접미(20)
// 서판: 공통 접두(13) + 공통 접미(9) + 종류별 고유. 방사능(irradiated)은 고유 옵션이 없다.

export const CORE = ${JSON.stringify(CORE, null, 2)};

// color·glow: 종류색 / 아이콘은 public/tablet/{slug}.png (slug = 이 객체의 키)
// implicit: 종류를 결정하는 고정 옵션 stat id ("… 추가, 잔여 사용 횟수 #회")
export const TABLET_META = ${JSON.stringify(meta, null, 2)};

// 방사능이 기본·첫 번째 (가장 많이 쓰는 종류)
export const TABLET_TYPES = ${JSON.stringify(TABLET_TYPES.map((t) => TABLET_META[t].slug))};
export const DEFAULT_TABLET_TYPE = "irradiated";
export const DEFAULT_TIER = "15"; // 경로석 기본 등급
`;

/* ---------- locales/kr.json ---------- */
const tablets = {}, bases = {};
for (const [ko, m] of Object.entries(TABLET_META)) {
  tablets[m.slug] = ko;
  bases[m.slug] = m.base;
}
const kr = {
  groups: {
    implicit: "옵션",
    prefix: "접두어",
    suffix: "접미어",
    unique: "{type} 고유 접미어", // {type} = tablets[slug]
  },
  tablets,
  bases: { ...bases, waystone: "경로석 ({tier}등급)" },
  // 정규식에 직접 박히는 게임 내 단어들
  tokens: { tier: "등급", corrupted: "타락", units: "%개마리초명회배" },
  options: L10N,
};

/* ---------- legacyIdMap.js ---------- */
// 옛 저장분은 전부 한국어다 — 옵션 id뿐 아니라 서판 종류·옵션그룹 키도 한국어였다.
const legacyTablets = {};
for (const [ko, m] of Object.entries(TABLET_META)) legacyTablets[ko] = m.slug;

const legacyGroups = {
  "waystone:옵션": "waystone:implicit",
  "waystone:접두어": "waystone:prefix",
  "waystone:접미어": "waystone:suffix",
  "tablet:접두어": "tablet:prefix",
  "tablet:접미어": "tablet:suffix",
  // 그보다 더 옛 이름 ('공통'을 떼기 전). 위 항목이 먼저 적용되므로 이건 못 옮긴 경우만 걸린다.
  "tablet:공통 접두어": "tablet:prefix",
  "tablet:공통 접미어": "tablet:suffix",
};
for (const [ko, m] of Object.entries(TABLET_META)) {
  legacyGroups[`tablet:${ko} 고유 접미어`] = `tablet:unique:${m.slug}`;
}

const legacyJs = `// 다국어 도입 전 localStorage에 쌓인 값을 한 번 이관하기 위한 옛→새 매핑.
// 옛 저장분은 옵션 id가 한국어 원문의 djb2 해시였고, 서판 종류·그룹 키도 한국어였다.
// 이관이 충분히 퍼졌다고 판단되면 이 파일과 storage.js의 호출부를 통째로 지울 것.

// 옛 optId(한국어 원문 해시) → 안정키
export const LEGACY_ID_MAP = ${JSON.stringify(LEGACY, null, 2)};

// 옛 서판 종류(한국어) → slug
export const LEGACY_TABLET_MAP = ${JSON.stringify(legacyTablets, null, 2)};

// 옛 옵션그룹 저장키(한국어 그룹명) → 새 키
export const LEGACY_GROUP_MAP = ${JSON.stringify(legacyGroups, null, 2)};
`;

mkdirSync("src/data/locales", { recursive: true });
writeFileSync("src/data/core.js", coreJs);
writeFileSync("src/data/locales/kr.json", JSON.stringify(kr, null, 2) + "\n");
writeFileSync("src/data/legacyIdMap.js", legacyJs);

console.error(`옵션 ${cursor}개 · 로케일 ${Object.keys(L10N).length}개 · 레거시 매핑 ${Object.keys(LEGACY).length}개`);
if (Object.keys(LEGACY).length !== cursor) console.error("⚠ 레거시 매핑 수가 옵션 수와 다름 — 한국어 원문 중복 의심");
