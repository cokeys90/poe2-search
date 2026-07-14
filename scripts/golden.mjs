// 회귀 골든 덤프 — 리팩터 전후로 생성 정규식이 동일한지 증명한다.
//
//   node scripts/golden.mjs > tests/golden.baseline.txt   # 리팩터 전 1회
//   node scripts/golden.mjs | diff tests/golden.baseline.txt -   # 리팩터 후
//
// 옵션의 한국어 원문을 라벨로 쓴다 — 리팩터 전후 양쪽에 존재하는 유일한 안정 라벨이라
// "같은 옵션이 같은 정규식을 낸다"를 그대로 비교할 수 있다.
// 데이터 구조가 바뀌면 loadOptions()만 갈아끼우고 나머지는 손대지 않는다.

import { piece, tierPiece, pricePiece, rangeRegex } from "../src/lib/regex.js";
import { buildPattern } from "../src/lib/pattern.js";
import { DATA } from "../src/data/options.js";

// 평탄화: 화면 풀 구분 없이 전 옵션. (정규식 생성은 소속과 무관)
function loadOptions() {
  const out = [];
  const push = (pool, items) => items.forEach((it) => out.push({ pool, ...it }));
  push("ws.implicit", DATA.waystone.implicit);
  push("ws.prefix", DATA.waystone.prefix);
  push("ws.suffix", DATA.waystone.suffix);
  push("tb.prefix", DATA.tablet.prefix);
  push("tb.suffix", DATA.tablet.suffix);
  for (const [type, items] of Object.entries(DATA.tablet.implicit)) push("tb.impl." + type, items);
  for (const [type, items] of Object.entries(DATA.tablet.unique)) push("tb.uniq." + type, items);
  return out;
}

const MINS = ["", "0", "1", "3", "5", "8", "11", "15", "20", "33", "80", "100", "999"];
// 최소·최대 짝 — 거래소와 같은 모델이라 max만 있는 경우가 실제로 들어온다
// ("무리 규모 최대 0" = 무리 규모가 없는 것). 그걸 놓치면 검색 의미가 뒤집힌다.
const PAIRS = [
  ["", "0"],
  ["", "1"],
  ["", "10"],
  ["", "50"],
  ["0", "0"],
  ["1", "3"],
  ["3", "6"],
  ["10", "20"],
  ["20", "10"], // 뒤집힌 입력 — 수치를 빼고 조각만 나와야 한다
];
const lines = [];
const L = (s) => lines.push(s);

// --- 1. 옵션별 piece() 전수
L("## piece");
for (const o of loadOptions()) {
  const opts = { openMax: o.openMax, rmin: o.rmin, rmax: o.rmax, noPercent: o.noPercent };
  for (const min of MINS) L(`${o.text}\t${min}\t${piece(o.frag, min, "", o.text, opts)}`);
  for (const [min, max] of PAIRS)
    L(`${o.text}\t${min}~${max}\t${piece(o.frag, min, max, o.text, opts)}`);
}

// --- 2. 등급
L("## tier");
for (const t of ["", "0", "1", "5", "15", "16", "abc"]) L(`${t}\t${tierPiece(t)}`);

// --- 3. 가격
L("## price");
const CURS = ["exalted", "chaos", "divine"];
for (const cur of CURS) {
  for (const mode of ["exact", "range"]) {
    for (const [min, max] of [["", ""], ["1", ""], ["", "50"], ["3", "3"], ["5", "40"], ["80", "120"], ["50", "10"]]) {
      L(`${cur}\t${mode}\t${min}\t${max}\t${pricePiece({ enabled: true, mode, min, max, currency: cur })}`);
    }
  }
}
L(`disabled\t\t\t\t${pricePiece({ enabled: false, mode: "exact", min: "3", max: "", currency: "chaos" })}`);

// --- 4. rangeRegex 경계 (CLAUDE.md §5 필수 케이스 + 자릿수 넘나드는 구간)
L("## range");
const RANGES = [[33, 999], [15, 999], [80, 120], [8, 12], [35, 40], [90, 100], [0, 6], [0, 999], [1, 9], [9, 11], [99, 101], [999, 999]];
for (const [lo, hi] of RANGES) L(`${lo}-${hi}\t${rangeRegex(lo, hi)}`);

// --- 5. 패턴 조립 (lib/pattern.js 실물 호출)
L("## pattern");
const all = loadOptions();
const pick = (pool, i) => all.filter((o) => o.pool === pool)[i];
// 경로석: 상단 옵션 2개 + 접두 1 + 접미 1
const ws = [
  { ...pick("ws.implicit", 1), mode: "inc", min: "15" },  // 아이템 희귀도
  { ...pick("ws.implicit", 0), mode: "inc", min: "3" },   // 부활 횟수
  { ...pick("ws.prefix", 0), mode: "exc", min: "" },
  { ...pick("ws.suffix", 0), mode: "inc", min: "11" },
];
// 서판
const tb = [
  { ...pick("tb.prefix", 0), mode: "inc", min: "" },
  { ...pick("tb.suffix", 0), mode: "inc", min: "20" },
  { ...pick("tb.prefix", 2), mode: "exc", min: "" },
];
// "그 모드가 없어야 한다"(최대 0) — 인게임에선 제외 검색으로 뒤집혀야 한다.
// 0%인 무리 규모는 줄이 아예 안 뜨므로 "무리.*0%"는 영원히 안 잡힌다. 부활은 "0"으로 뜨니 값으로 찾는다.
const absent = [
  { ...pick("ws.implicit", 2), mode: "inc", min: "", max: "0" }, // 무리 규모 → "!무리"
  { ...pick("ws.implicit", 0), mode: "inc", min: "", max: "0" }, // 부활 횟수 → "부활.*0"
  { ...pick("ws.implicit", 1), mode: "inc", min: "55", max: "" },
];
// sel은 이제 {안정키: {mode, min, max}} — 옵션 본문은 buildPattern이 데이터에서 되살린다
const asSel = (arr) =>
  Object.fromEntries(arr.map((o) => [o.key, { mode: o.mode, min: o.min, max: o.max ?? "" }]));

const CASES = [];
for (const [name, arr, tab] of [
  ["ws", ws, "waystone"],
  ["tb", tb, "tablet"],
  ["absent", absent, "waystone"],
]) {
  for (const mode of ["and", "or"]) {
    for (const corrupt of ["any", "yes", "no"]) {
      for (const tier of ["", "15"]) {
        for (const price of [
          { enabled: false },
          { enabled: true, mode: "exact", min: "3", max: "", currency: "chaos" },
          { enabled: true, mode: "range", min: "5", max: "40", currency: "exalted" },
        ]) {
          CASES.push([`${name}/${mode}/${corrupt}/t${tier || "-"}/p${price.enabled ? price.mode : "-"}`,
            { sel: asSel(arr), mode, tab, tier, corrupt, price }]);
        }
      }
    }
  }
}
// 빈 선택
CASES.push(["empty/waystone", { sel: {}, mode: "and", tab: "waystone", tier: "", corrupt: "any", price: { enabled: false } }]);
CASES.push(["empty/tablet", { sel: {}, mode: "and", tab: "tablet", tier: "", corrupt: "any", price: { enabled: false } }]);

for (const [name, cfg] of CASES) {
  const p = buildPattern(cfg);
  L(`${name}\t${p.length}\t${p}`);
}

process.stdout.write(lines.join("\n") + "\n");
