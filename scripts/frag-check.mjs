// 검색조각(frag) 검증기 — 조각이 그 옵션'만' 찾는지 확인하고 보고서를 낸다.
//
//   node scripts/frag-check.mjs              # 요약 + 문제만
//   node scripts/frag-check.mjs --all        # 전체 조각 표
//   node scripts/frag-check.mjs --pool tablet:breach
//
// ── 검사 원리 ────────────────────────────────────────────────────
// 조각의 목적은 "같은 아이템 안에서 그 옵션만 매칭"이다(CLAUDE.md §4-2).
// 그래서 옵션 하나가 아니라 **그 옵션이 실제로 함께 놓이는 풀 전체**에 대고 돌려야 한다.
//   경로석  = 옵션(6) + 접두(15) + 접미(20)          … 한 풀
//   서판    = 공통접두 + 공통접미 + {종류}고유        … 종류마다 다른 풀 (같은 조각이 종류별로 다르게 겹칠 수 있다)
// 한 옵션이 여러 풀에 속하면(공통 옵션) 가장 나쁜 풀의 겹침 수를 그 조각의 overlap으로 본다.
//
// ⚠️ 조각은 '한 줄 안에서' 매칭돼야 한다.
// 모드 하나가 여러 줄인 경우가 있다(복합 모드: "무리 규모 감소" / "경로석 수량 증가" / "성소 1개 추가").
// 우리 데이터는 그 줄들을 " / "로 이어 적지만, 게임 화면에서는 별개의 줄이다.
// 정규식의 "."은 보통 줄바꿈을 넘지 않고, 참조 엔진 poe2.re가 "$"(줄 끝) 앵커를 쓰는 것도
// 게임 검색이 줄 단위라는 정황이다. 확증은 없으나 — 한 줄 안에서 닫히는 조각은
// 두 가정(줄 단위 / 아이템 전체) 모두에서 동작하므로 보수적으로 줄 단위를 강제한다.

import { DATA, TABLET_TYPES, tabletName } from "../src/data/options.js";
import { piece, parseRange } from "../src/lib/regex.js";

const args = process.argv.slice(2);
const showAll = args.includes("--all");
const onlyPool = args.includes("--pool") ? args[args.indexOf("--pool") + 1] : null;

// 함께 놓이는 옵션들의 묶음
function pools() {
  const out = [
    {
      id: "waystone",
      label: "경로석",
      items: [...DATA.waystone.implicit, ...DATA.waystone.prefix, ...DATA.waystone.suffix],
    },
  ];
  for (const t of TABLET_TYPES) {
    out.push({
      id: `tablet:${t}`,
      label: `서판 · ${tabletName(t)}`,
      items: [...DATA.tablet.prefix, ...DATA.tablet.suffix, ...(DATA.tablet.unique[t] || [])],
    });
  }
  return out;
}

// 게임 검색 문법 = 정규식.
//  i — 게임은 대소문자를 가리지 않는다 (한국어엔 무의미하나 라틴 문자 언어에 필요)
//  m — "^"는 아이템 전체의 시작이 아니라 '줄'의 시작이다
function compile(frag) {
  try {
    return new RegExp(frag, "im");
  } catch {
    return null;
  }
}

// ⚠️ 데이터의 원문은 "지도에 금고 (1—2)개 추가 등장" 같은 틀이지만,
// 게임 화면에는 실제로 굴려진 값이 찍힌다: "지도에 금고 1개 추가 등장".
// 조각의 "."은 글자 수를 세므로 이 차이가 결과를 바꾼다 ("고.개"는 "고 1개"에 안 맞는다 — 사이가 2글자).
// 그래서 굴려질 수 있는 값(최소·최대)을 실제로 넣어 본 변형 전부에 대고 검사한다.
//
// 경로석 상단 6옵션은 원문이 이름표뿐이고("아이템 희귀도"), 게임에는 "아이템 희귀도: +12%"로 뜬다.
// 부활 횟수만 % 없이 "부활 횟수: 3".
function isImplicit(it) {
  return !!it.map_filter;
}

// 게임의 "어드밴스드 모드 설명"을 켜면 값이 "28(27-33)%"로, 끄면 "28%"로 뜬다.
// 어느 쪽으로 켜 두든 검색이 돼야 하므로 두 표시 모두 만들어 검사한다.
function showValue(v, a, b, advanced) {
  return advanced ? `${v}(${a}-${b})` : `${v}`;
}

// 옵션 하나가 게임 화면에서 차지하는 줄들. 데이터는 " / "로 이어 적는다.
const linesOf = (text) => text.split(" / ");

// 게임에 뜰 수 있는 표시들. 각 항목은 '줄 배열'이다 (줄을 넘나드는 매칭을 막기 위해).
function renderIngame(it) {
  const text = it.text;
  if (isImplicit(it)) {
    // 상단 6종은 합산 값이라 범위 표시가 없다. 자릿수가 다르면 글자 수도 달라지므로 2·3자리 둘 다.
    const vals = it.rmin != null ? [it.rmin, it.rmax] : [12, 145];
    return vals.map((v) => [`${text}: +${v}${it.noPercent ? "" : "%"}`]);
  }
  if (!/\((-?\d+)[—–-](-?\d+)\)/.test(text)) return [linesOf(text)];
  const out = [];
  for (const advanced of [false, true]) {
    for (const which of [0, 1]) {
      out.push(
        linesOf(
          text.replace(/\((-?\d+)[—–-](-?\d+)\)/g, (_, a, b) =>
            showValue(which === 0 ? a : b, a, b, advanced)
          )
        )
      );
    }
  }
  // 중복 제거
  const seen = new Set();
  return out.filter((ls) => {
    const k = ls.join("\n");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// 어느 한 줄 안에서 매칭되는가
const hitsLines = (re, lines) => lines.some((l) => re.test(l));

// 그 옵션에 값을 넣었을 때 실제로 굴려진 값 (검색어 생성 + 매칭 검사에 같이 쓴다)
function rolledValues(it) {
  if (isImplicit(it)) return it.rmin != null ? [it.rmin, it.rmax] : [12, 145];
  const r = parseRange(it.text);
  return r ? [...new Set([r.min, r.max])] : [];
}

// 조각이 그 원문을 잡는가 — 게임에 뜰 수 있는 모든 변형에서, 한 줄 안에서 잡혀야 한다.
// 하나라도 놓치면 그 값이 굴려졌을 때 그 매물은 검색에서 사라진다.
function matchesAll(re, it) {
  return renderIngame(it).every((lines) => hitsLines(re, lines));
}
function matchesAny(re, it) {
  return renderIngame(it).some((lines) => hitsLines(re, lines));
}

// 수치까지 넣은 '완성된 검색어'가 매칭되는가.
// piece()는 조각 뒤에 ".*<수치>"를 붙인다. 그래서 조각이 텍스트에서 숫자보다 뒤에 있으면 깨진다:
//   "센.*개" + 값2 → "센.*개.*2개"  ← "에센스 2개"에는 개 다음에 또 2개가 없다 → 검색 실패
// 조각은 반드시 숫자보다 앞에서 끝나야 한다.
function numericBreaks(it) {
  const vals = rolledValues(it);
  if (!vals.length) return null;
  const opts = { openMax: it.openMax, rmin: it.rmin, rmax: it.rmax, noPercent: it.noPercent };
  for (const v of vals) {
    const pat = piece(it.frag, String(v), it.text, opts);
    const re = compile(pat);
    if (!re) return { v, pat, why: "정규식으로 컴파일되지 않음" };
    // 그 값이 굴려졌을 때의 게임 표시 — 범위 표시 켬/끔 양쪽, 한 줄 안에서
    for (const advanced of [false, true]) {
      const lines = isImplicit(it)
        ? [`${it.text}: +${v}${it.noPercent ? "" : "%"}`]
        : linesOf(
            it.text.replace(/\((-?\d+)[—–-](-?\d+)\)/g, (_, a, b) => showValue(v, a, b, advanced))
          );
      if (!hitsLines(re, lines)) {
        return {
          v,
          pat,
          shown: lines.join(" ⏎ "),
          why: `완성된 검색어가 그 값을 못 잡음 (범위 표시 ${advanced ? "켬" : "끔"})`,
        };
      }
    }
  }
  return null;
}

const results = new Map(); // key → { frag, worst: {poolId, hits:[key…]} }
const broken = new Map(); // key → 이유 (옵션은 여러 풀에 나오므로 한 번만 담는다)

for (const pool of pools()) {
  if (onlyPool && pool.id !== onlyPool) continue;

  for (const it of pool.items) {
    const re = compile(it.frag);
    if (!re) {
      broken.set(it.key, { frag: it.frag, text: it.text, why: "정규식으로 컴파일되지 않음" });
      continue;
    }
    // 겹침 판정: 다른 옵션을 '어느 값에서든' 잡으면 겹치는 것으로 본다 (보수적)
    const hits = pool.items.filter((o) => matchesAny(re, o));

    // 자기 자신은 '모든 값에서' 잡아야 한다 — 특정 값에서만 놓쳐도 그 매물은 검색에서 사라진다
    if (!matchesAll(re, it)) {
      const missed = renderIngame(it).filter((ls) => !hitsLines(re, ls)).map((ls) => ls.join(" ⏎ "));
      broken.set(it.key, {
        frag: it.frag,
        text: it.text,
        why: matchesAny(re, it)
          ? `일부 값에서 매칭 실패 — 예: "${missed[0]}"`
          : `자기 자신을 매칭하지 못함 — 게임 표시: "${renderIngame(it)[0].join(" ⏎ ")}"`,
      });
    } else {
      // 수치를 넣은 완성 검색어까지 확인
      const nb = numericBreaks(it);
      if (nb) {
        broken.set(it.key, {
          frag: it.frag,
          text: it.text,
          why: `수치 ${nb.v} 검색 실패 — 검색어 "${nb.pat}" 가 "${nb.shown ?? "?"}" 를 못 잡음`,
        });
      }
    }
    const prev = results.get(it.key);
    if (!prev || hits.length > prev.worst.hits.length) {
      results.set(it.key, {
        frag: it.frag,
        stored: it.overlap,
        text: it.text,
        worst: { poolId: pool.id, poolLabel: pool.label, hits: hits.map((o) => o.key) },
      });
    }
  }
}

/* ---------- 보고서 ---------- */
const rows = [...results.entries()].map(([key, r]) => ({
  key,
  frag: r.frag,
  text: r.text,
  stored: r.stored,
  actual: r.worst.hits.length,
  pool: r.worst.poolLabel,
  hits: r.worst.hits,
}));

const unique = rows.filter((r) => r.actual === 1);
const overlapping = rows.filter((r) => r.actual > 1);
const mismatched = rows.filter((r) => r.stored !== r.actual);

console.log("═══ 검색조각 검증 보고서");
console.log(`대상 옵션 ${rows.length}개 · 풀 ${pools().length}개 (경로석 1 + 서판 ${TABLET_TYPES.length})\n`);
console.log(`  고유(그 옵션만 매칭)   ${unique.length}`);
console.log(`  겹침(2개 이상 매칭)    ${overlapping.length}`);
console.log(`  데이터의 overlap 불일치 ${mismatched.length}`);
console.log(`  깨진 조각              ${broken.size}`);

if (broken.size) {
  console.log("\n─── ✗ 깨진 조각 (게임에서 그 옵션이 아예 검색되지 않는다)");
  for (const [key, b] of broken) {
    console.log(`\n  ${key}`);
    console.log(`    조각: ${b.frag}`);
    console.log(`    원문: ${b.text}`);
    console.log(`    → ${b.why}`);
  }
}

if (overlapping.length) {
  console.log("\n─── ⚠ 겹치는 조각 (그 옵션만 찾지 못한다 — 수치로 최종 특정해야 함)");
  for (const r of overlapping.sort((a, b) => b.actual - a.actual)) {
    console.log(`\n  ${r.key}   frag: ${r.frag}   ${r.actual}개 매칭  [${r.pool}]`);
    for (const h of r.hits) console.log(`      ${h === r.key ? "●" : "○"} ${h}`);
  }
}

if (mismatched.length) {
  console.log("\n─── ⚠ 데이터의 overlap 값이 실제와 다름");
  for (const r of mismatched) {
    console.log(`  ${r.key}   데이터 overlap=${r.stored} · 실제=${r.actual}`);
  }
}

if (showAll) {
  console.log("\n─── 전체 조각");
  for (const r of rows) {
    console.log(`  ${r.actual === 1 ? "✓" : "⚠"} ${r.key.padEnd(36)} ${r.frag.padEnd(14)} ${r.text.slice(0, 44)}`);
  }
}

const bad = broken.size + overlapping.filter((r) => r.stored === 1).length;
console.log(bad ? `\n실패 ${bad}건` : "\n문제 없음");
process.exit(broken.size ? 1 : 0);
