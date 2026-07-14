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
// 게임 검색은 아이템 전체 텍스트를 본다 — 줄 단위가 아니다.
// 근거: 기존 조각 "센.*경"은 "…에센스 1개 추가 등장 / …경로석 수량 % 증가" 두 줄에 걸쳐 매칭된다.
// 따라서 검사도 옵션의 전체 텍스트에 대고 한다.

import { DATA, TABLET_TYPES, tabletName } from "../src/data/options.js";

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

// 게임 검색 문법 = 정규식. 조각을 그대로 컴파일한다.
// (게임은 대소문자를 가리지 않는다 → i 플래그. 한국어엔 영향 없고 라틴 문자 언어에 필요하다.)
function compile(frag) {
  try {
    return new RegExp(frag, "i");
  } catch {
    return null;
  }
}

// ⚠️ 데이터의 원문은 "지도에 금고 (1—2)개 추가 등장" 같은 틀이지만,
// 게임 화면에는 실제로 굴려진 값이 찍힌다: "지도에 금고 1개 추가 등장".
// 조각의 "."은 글자 수를 세므로 이 차이가 결과를 바꾼다 ("고.개"는 "고 1개"에 안 맞는다 — 사이가 2글자).
// 그래서 범위를 실제 값으로 바꾼 여러 변형을 만들어 전부에 대고 검사한다.
// 자릿수가 달라지면 글자 수도 달라지므로 최소·최대를 모두 넣어 본다.
function renderIngame(text) {
  const ranges = [...text.matchAll(/\((-?\d+)[—–-](-?\d+)\)/g)];
  if (!ranges.length) return [text];
  const pick = (which) =>
    text.replace(/\((-?\d+)[—–-](-?\d+)\)/g, (_, a, b) => (which === "min" ? a : b));
  return [...new Set([pick("min"), pick("max")])];
}

// 조각이 그 원문을 잡는가 — 게임에 뜰 수 있는 모든 변형에서 잡혀야 한다.
// 하나라도 놓치면 그 값이 굴려졌을 때 검색에서 사라진다.
function matchesAll(re, text) {
  return renderIngame(text).every((v) => re.test(v));
}
function matchesAny(re, text) {
  return renderIngame(text).some((v) => re.test(v));
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
    const hits = pool.items.filter((o) => matchesAny(re, o.text));

    // 자기 자신은 '모든 값에서' 잡아야 한다 — 특정 값에서만 놓쳐도 그 매물은 검색에서 사라진다
    if (!matchesAll(re, it.text)) {
      const missed = renderIngame(it.text).filter((v) => !re.test(v));
      broken.set(it.key, {
        frag: it.frag,
        text: it.text,
        why: matchesAny(re, it.text)
          ? `일부 값에서 매칭 실패 — 예: "${missed[0]}"`
          : `자기 자신을 매칭하지 못함 — 게임 표시: "${renderIngame(it.text)[0]}"`,
      });
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
