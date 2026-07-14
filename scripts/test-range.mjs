// rangeRegex 경계값 전수 테스트 (CLAUDE.md §5).
// 생성된 정규식의 축약(. , \d)을 [0-9]로 되돌린 뒤, 구간 안팎의 모든 정수를 넣어 본다.
//
//   node scripts/test-range.mjs

import { rangeRegex } from "../src/lib/regex.js";

function check(lo, hi) {
  const pat = rangeRegex(lo, hi).replace(/\\d/g, "[0-9]").replace(/\./g, "[0-9]");
  const re = new RegExp("^" + pat + "$");
  for (let v = Math.max(0, lo - 2); v <= hi + 3; v++) {
    const want = v >= lo && v <= hi;
    if (re.test(String(v)) !== want) return `FAIL v=${v} (기대 ${want})  pat=${pat}`;
  }
  return null;
}

// CLAUDE.md가 반드시 통과하라고 못박은 케이스 + 자릿수를 넘나드는 구간(여기서 자주 터진다)
const CASES = [
  [33, 999], [15, 999], [80, 120], [8, 12], [35, 40], [90, 100], [0, 6],
  [0, 999], [1, 9], [9, 11], [99, 101], [999, 999], [100, 999], [5, 5], [7, 89],
];

let bad = 0;
for (const [lo, hi] of CASES) {
  const err = check(lo, hi);
  console.log(`${err ? "✗" : "✓"} [${lo},${hi}] ${rangeRegex(lo, hi)}${err ? "  ← " + err : ""}`);
  if (err) bad++;
}
console.log(bad ? `\n실패 ${bad}/${CASES.length}` : `\n전부 통과 (${CASES.length}개 구간)`);
process.exit(bad ? 1 : 0);
