// 250자 예산 실측 — 언어별로 옵션 몇 개까지 게임 검색창에 들어가는가.
//
//   node scripts/test-budget.mjs
//
// 덮는 것 (F-03 검색어 생성 · 250자 제한):
//   게임 검색창은 250자까지다. 조각은 언어마다 길이가 다르다(한글은 글자 단위 2~3자,
//   라틴 문자는 단어 단위라 훨씬 길다). 라틴 언어에서 실전 조합이 250자를 넘으면
//   그 언어는 "된다"고 말할 수 없다 — 지금까지 한 번도 재본 적이 없었다.
//
// 판정: 실전 조합(경로석 5옵션 / 서판 6옵션)이 250자 안에 들어가야 한다.

import "./fs-locales.mjs";
import { LANGS, setLang, DATA, DEFAULT_USES } from "../src/data/options.js";
import { buildPattern } from "../src/lib/pattern.js";

const LIMIT = 250;
const WARN = 200; // 여유가 이만큼도 없으면 실전에서 위험하다

// 실전에서 실제로 쓰는 조합. 값은 흔히 거르는 선.
const CASES = [
  {
    name: "경로석 · 상단 3 + 접두 2 + 15등급 + 타락제외",
    make: () => ({
      tab: "waystone",
      tier: "15",
      corrupt: "no",
      mode: "and",
      sel: {
        ...pick(DATA.waystone.implicit, 3, "20"),
        ...pick(DATA.waystone.prefix, 2, "10"),
      },
      price: { enabled: false },
    }),
  },
  {
    name: "서판/균열 · 접두 2 + 접미 2 + 고유 2 + 잔여10",
    make: () => ({
      tab: "tablet",
      tabletType: "breach",
      mode: "or",
      uses: { on: true, min: DEFAULT_USES },
      sel: {
        ...pick(DATA.tablet.prefix, 2, "10"),
        ...pick(DATA.tablet.suffix, 2, "80"),
        ...pick(DATA.tablet.unique.breach, 2, "20"),
      },
      price: { enabled: false },
    }),
  },
  {
    name: "서판/균열 · 최대치(접두 4 + 접미 4 + 고유 4)",
    make: () => ({
      tab: "tablet",
      tabletType: "breach",
      mode: "or",
      uses: { on: true, min: DEFAULT_USES },
      sel: {
        ...pick(DATA.tablet.prefix, 4, "10"),
        ...pick(DATA.tablet.suffix, 4, "80"),
        ...pick(DATA.tablet.unique.breach, 4, "20"),
      },
      price: { enabled: false },
    }),
    soft: true, // 이건 과한 조합이라 넘어도 실패로 치지 않는다 — 참고치
  },
];

const pick = (list, n, min) =>
  Object.fromEntries(list.slice(0, n).map((o) => [o.key, { mode: "inc", min }]));

let fail = 0;
const rows = [];

for (const lang of LANGS) {
  await setLang(lang);
  for (const c of CASES) {
    const len = buildPattern(c.make()).length;
    const over = len > LIMIT;
    if (over && !c.soft) fail++;
    rows.push([over ? "❌" : len > WARN ? "⚠️ " : "  ", lang, c.name, len, c.soft ? "참고" : ""]);
  }
}

const w = (s, n) => String(s).padEnd(n);
console.log(`${w("", 3)}${w("언어", 5)}${w("조합", 46)}${w("글자수", 8)}`);
for (const r of rows) console.log(`${w(r[0], 3)}${w(r[1], 5)}${w(r[2], 46)}${w(r[3] + "/250", 8)}${r[4]}`);

console.log(`\n❌ = 250자 초과(실패) · ⚠️ = ${WARN}자 초과(여유 없음)`);
console.log(fail ? `\n예산 초과 ${fail}건` : "\n실전 조합은 전부 250자 안에 들어간다");
process.exit(fail ? 1 : 0);
