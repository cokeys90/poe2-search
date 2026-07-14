// 여러 줄짜리 모드 감사 — "실제 옵션 줄"과 "딸려 붙는 부가 옵션 줄"을 가려낸다.
//
//   node scripts/audit-multiline.mjs
//   (선행: scripts/scrape-poe2db.mjs, scripts/scrape-tablet-types.mjs)
//
// ★ 게임이 업데이트되어 옵션이 바뀌면 반드시 다시 돌릴 것. ★
//
// ── 왜 필요한가 ────────────────────────────────────────────────
// poe2db는 모디파이어 하나를 여러 줄로 준다. 그중 게임 화면에 실제로 뜨는 건 한 줄뿐이고
// 나머지는 그 옵션이 붙으면 따라오는 부가 옵션이다. 검색조각은 실제 옵션 줄로만 만들어야 한다.
// 부가 옵션까지 text에 넣으면 다른 옵션의 조각이 그 줄을 잘못 잡는다
// (실제로 "내.무"(무리 규모)와 "견.*경"(경로석 수량)이 복합 모드의 부가 줄을 잡고 있었다).
//
// ── 어느 줄이 실제 옵션인가 ───────────────────────────────────
// · 경로석: **첫 줄**. 나머지(무리 규모 증폭·지역 경로석 증폭 등)는 게임 화면에 아예 안 뜨는
//   내부 효과다. 인게임 스크린샷에서 모드당 한 줄만 표시되는 것으로 확인했다.
// · 서판: **마지막 줄**. 앞줄들이 부가 옵션이다.
//   ⚠️ 단, 마지막 줄이 '이미 독립 옵션으로 존재하는 것'이면 그건 부가 옵션이다 → 다른 줄이 실제 옵션이다.
//      poe2db의 에센스 항목이 그렇다: [에센스 1개 추가, 경로석 수량 증가] 순인데
//      "경로석 수량 증가"는 접미어에 독립 옵션으로 따로 있다 → 실제 옵션은 "에센스 1개 추가".
//      이 스크립트가 그런 충돌을 잡아서 알려준다.

import { readFileSync } from "node:fs";
import { DATA } from "../src/data/options.js";

// scrape-tablet-types.mjs가 { implicits, bases, names, mods } 를 준다 — 모드는 mods 아래에 있다
const types = JSON.parse(readFileSync("scripts/out/tablet-types-kr.json", "utf8")).mods;

// 수치를 '완전히' 지운다. 자리표시자(#)로 남기면 안 된다 —
// poe2db는 같은 줄을 어떤 데선 "(30—40)% 증가", 어떤 데선 값 없이 "% 증가"로 준다.
// 남겨두면 두 줄이 다른 것으로 보여 충돌 탐지가 실패한다.
const norm = (t) =>
  t
    .replace(/\((-?\d+)[—–-](-?\d+)\)/g, "")
    .replace(/-?\d+/g, "")
    .replace(/#/g, "")
    .replace(/\s+/g, " ")
    .trim();

// 게임 화면에 뜨지 않는 내부 스탯 (번역 없이 "map atlas reveal fog radius [5]" 식으로 나온다)
const isInternal = (line) => /^[a-z][a-z \[\],0-9+%-]*$/i.test(line) && !/[가-힣]/.test(line);

/* ── 독립 옵션으로 존재하는 서판 옵션들 (한 줄짜리 모드) ─────────
   복합 모드 자신은 빼야 한다 — 자기 자신과 충돌한다고 보고하면 안 된다. */
const standalone = new Map(); // 정규화 텍스트 → key
for (const it of [...DATA.tablet.prefix, ...DATA.tablet.suffix]) {
  if (it.extra?.length) continue; // 복합 모드는 제외
  standalone.set(norm(it.text), it.key);
}

/* ── 우리 데이터가 지금 어느 줄을 쓰는가 ───────────────────── */
const ourText = new Map(); // 정규화 텍스트 → [key…]  (수치를 지우면 같아지는 다른 옵션이 있다)
for (const it of [
  ...DATA.tablet.prefix,
  ...DATA.tablet.suffix,
  ...Object.values(DATA.tablet.unique).flat(),
]) {
  const k = norm(it.text);
  if (!ourText.has(k)) ourText.set(k, []);
  ourText.get(k).push(it.key);
}

/* ── 서판의 여러 줄 모드 ───────────────────────────────────── */
const seen = new Set();
const multi = [];
for (const r of types) {
  if (!r.lines || r.lines.length < 2) continue;
  if (r.lines.every(isInternal)) continue; // 화면에 안 뜨는 내부 스탯뿐인 모드
  const k = r.lines.map(norm).join(" ¶ ");
  if (seen.has(k)) continue;
  seen.add(k);
  multi.push({ scope: r.types.length === 8 ? "공통" : r.types[0], lines: r.lines, gen: r.gen });
}

console.log(`서판의 여러 줄짜리 모드 ${multi.length}개\n`);

const conflicts = [];
for (const m of multi) {
  const last = m.lines[m.lines.length - 1];
  const dupKey = standalone.get(norm(last));

  // 기본 규칙: 마지막 줄이 실제 옵션.
  // 예외: 마지막 줄이 이미 독립 옵션이면 그건 부가 옵션이다 → 남은 줄 중에서 골라야 한다.
  let real, extras, note;
  if (dupKey) {
    const others = m.lines.filter((l) => norm(l) !== norm(last));
    real = others[others.length - 1];
    extras = m.lines.filter((l) => l !== real);
    note = `⚠ 마지막 줄이 독립 옵션(${dupKey})과 같다 → 부가 옵션으로 보고 다른 줄을 실제 옵션으로 잡음`;
    conflicts.push({ ...m, dupKey, real });
  } else {
    real = last;
    extras = m.lines.slice(0, -1);
  }

  const keys = ourText.get(norm(real)) || [];
  console.log(`[서판 ${m.scope} · ${m.gen === 1 ? "접두" : "접미"}]${note ? "  " + note : ""}`);
  console.log(
    `   실제 옵션: ${real}   ${keys.length ? `← 우리 데이터: ${keys.join(", ")} ✓` : "← ✗ 우리 데이터에 없다"}`
  );
  for (const e of extras) console.log(`   부가 옵션: ${e}`);
  console.log();
}

if (conflicts.length) {
  console.log("─".repeat(70));
  console.log(`규칙 예외 ${conflicts.length}건 — 마지막 줄이 부가 옵션이라 손으로 확정해야 한다:`);
  for (const c of conflicts) {
    console.log(`  · [${c.scope}] 실제 옵션으로 잡은 줄: "${c.real}"`);
    console.log(`      (마지막 줄 "${c.lines[c.lines.length - 1]}"은 ${c.dupKey}와 겹친다)`);
  }
  console.log("\n게임에서 실제 표시를 확인하고 로케일의 text/extra를 맞출 것.");
}
