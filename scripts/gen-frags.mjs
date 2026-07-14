// 검색조각 생성기 — 옵션 하나씩 만들고, 같은 풀 전체와 충돌 검사하고, 통과해야 다음으로 넘어간다.
//
//   node scripts/gen-frags.mjs kr            # 한 언어
//   node scripts/gen-frags.mjs kr --report   # 전체 조각 표까지
//   node scripts/gen-frags.mjs               # 10개 언어 전부
//
// → scripts/out/frags-{lang}.json  + 보고서
//
// ── 방식 ────────────────────────────────────────────────────────
// 그 옵션을 유일하게 특정하는 **가장 짧은 연속 부분문자열**을 찾는다. 언어 무관하게 통한다:
//   화염 / 관통 (한국어)   ·   "son o" ← Poison on Hit (영어, poe2.re도 같은 방식)
//   공백이 없는 태국어에서도 그대로 성립한다.
// 하나로 안 되면 두 조각을 ".*"로 잇는다 (같은 줄 안, 같은 쪽).
//
// ── 지켜야 하는 제약 (전부 인게임으로 확인한 것) ─────────────────
// 1. 한 줄 안에서 닫혀야 한다 — "."은 줄바꿈을 넘지 않는다.
// 2. 굴려지는 값을 걸치면 안 된다 — 수치는 piece()가 조각의 앞이나 뒤에 붙인다.
//    그래서 후보는 '값보다 앞' 또는 '값보다 뒤' 한쪽에서만 뽑는다.
// 3. 끝(또는 앞) 공백은 게임이 잘라낸다 → "\s"로 쓴다.
// 4. 짧을수록 좋다 — 게임 검색창은 250자다.
// 5. 자기 자신은 굴려질 수 있는 모든 값에서 잡아야 한다.

import { readFileSync, writeFileSync } from "node:fs";
import { CORE, TABLET_TYPES } from "../src/data/core.js";
import { LANGS } from "./langs.mjs";

const texts = JSON.parse(readFileSync("scripts/out/texts.json", "utf8"));

const RANGE = /\((-?\d+)[—–-](-?\d+)\)/;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ── 옵션 목록 (코어 + 그 언어의 원문) ───────────────────────── */
function options(lang) {
  const out = [];
  const add = (list, pools) => {
    for (const c of list) {
      const text = texts[c.key]?.[lang];
      if (!text) throw new Error(`${lang}: 원문 없음 — ${c.key}`);
      out.push({ ...c, text, pools });
    }
  };
  const TB = TABLET_TYPES.map((t) => `tablet:${t}`);
  add(CORE.waystone.implicit, ["waystone"]);
  add(CORE.waystone.prefix, ["waystone"]);
  add(CORE.waystone.suffix, ["waystone"]);
  add(CORE.tablet.prefix, TB);
  add(CORE.tablet.suffix, TB);
  for (const t of TABLET_TYPES) {
    add(CORE.tablet.implicit[t] || [], [`tablet:${t}`]);
    add(CORE.tablet.unique[t] || [], [`tablet:${t}`]);
  }
  return out;
}

/* ── 게임 화면 재현 ──────────────────────────────────────────── */
const isImplicit = (o) => !!o.map_filter;
const linesOf = (t) => t.split(" / ");

// 굴려질 수 있는 값들 (자릿수가 달라지면 글자 수도 달라지므로 최소·최대 둘 다)
function rolls(o) {
  if (isImplicit(o)) return o.rmin != null ? [o.rmin, o.rmax] : [12, 145];
  const m = o.text.match(RANGE);
  return m ? [...new Set([+m[1], +m[2]])] : [];
}

// 그 값이 굴려졌을 때 게임에 뜨는 줄들
function render(o, v) {
  if (isImplicit(o)) {
    // 어느 언어든 "이름표: +12%" 꼴이다 (인게임 캡처로 확인)
    return [`${o.text}: +${v}${o.noPercent ? "" : "%"}`];
  }
  return linesOf(o.text.replace(new RegExp(RANGE, "g"), String(v)));
}

// 그 옵션이 게임에 뜰 수 있는 모든 모습 (줄 배열들)
function renders(o) {
  const vs = rolls(o);
  if (!vs.length) return [linesOf(o.text)];
  return vs.map((v) => render(o, v));
}

const hits = (re, o) => renders(o).some((lines) => lines.some((l) => re.test(l)));
const hitsAll = (re, o) => renders(o).every((lines) => lines.some((l) => re.test(l)));

/* ── 후보 만들기 ─────────────────────────────────────────────
   값보다 앞 / 값보다 뒤 각각에서 연속 부분문자열을 뽑는다.
   앞뒤 공백은 게임이 잘라내므로 "\s"로 바꿔 표현한다. */
function candidates(o) {
  const line = isImplicit(o) ? o.text : linesOf(o.text)[0];
  const m = line.match(RANGE);
  const sides = m
    ? [line.slice(0, m.index), line.slice(m.index + m[0].length)]
    : [line];

  const seen = new Set();
  const out = [];
  const push = (f) => {
    if (seen.has(f)) return;
    seen.add(f);
    out.push(f);
  };

  for (const [si, side] of sides.entries()) {
    const atLineStart = si === 0; // 값 앞쪽은 줄의 시작을 포함한다
    const atLineEnd = si === sides.length - 1; // 값 뒤쪽은 줄의 끝을 포함한다
    for (let i = 0; i < side.length; i++) {
      for (let len = 2; len <= Math.min(side.length - i, 24); len++) {
        const raw = side.slice(i, i + len);
        // 글자(문자·숫자)가 최소 둘은 있어야 한다.
        // 없으면 "\s%" 같은 구두점 쪼가리가 뽑힌다 — 짧기만 하고 의미가 없어 게임 업데이트에 쉽게 깨진다.
        if ((raw.match(/[\p{L}\p{N}]/gu) || []).length < 2) continue;
        // 앞뒤 공백은 리터럴로 못 쓴다 → \s
        const body = esc(raw.trim());
        const pre = /^\s/.test(raw) ? "\\s" : "";
        const post = /\s$/.test(raw) ? "\\s" : "";
        const frag = pre + body + post;
        push(frag);

        // 줄 시작/끝 앵커 — 다른 옵션의 '부분'으로만 겹칠 때 이걸로 갈린다.
        // 예: 공통의 "몬스터의 효율"은 균열의 "희귀 균열 몬스터의 효율"에 통째로 들어 있다
        //     → "^몬스터의 효율"이면 공통만 잡힌다.
        if (atLineStart && i === 0) push("^" + frag);
        if (atLineEnd && i + len === side.length) push(frag + "$");
      }
    }
  }
  // 짧은 것 우선 (250자 예산). 같은 길이면 앵커 없는 쪽을 먼저 — 더 단순하고 덜 깨진다.
  const rank = (f) => (/^\^/.test(f) || /\$$/.test(f) ? 1 : 0);
  return out.sort((a, b) => a.length - b.length || rank(a) - rank(b) || a.localeCompare(b));
}

/* ── 생성 + 검증 ─────────────────────────────────────────────── */
function generate(lang, verbose) {
  const opts = options(lang);
  const byPool = new Map();
  for (const o of opts) for (const p of o.pools) {
    if (!byPool.has(p)) byPool.set(p, []);
    byPool.get(p).push(o);
  }

  const result = {};
  const report = [];

  for (const o of opts) {
    // 그 옵션이 함께 놓이는 모든 옵션 (자기 자신 제외)
    const rivals = [...new Set(o.pools.flatMap((p) => byPool.get(p)))].filter((x) => x.key !== o.key);

    let best = null; // { frag, overlap }
    for (const frag of candidates(o)) {
      let re;
      try {
        re = new RegExp(frag, "im");
      } catch {
        continue;
      }
      if (!hitsAll(re, o)) continue; // 자기 자신을 모든 값에서 잡아야 한다
      const clash = rivals.filter((r) => hits(re, r));
      if (clash.length === 0) {
        best = { frag, overlap: 1, clash: [] };
        break; // 고유하면 즉시 채택 (후보는 짧은 순이라 이게 최단이다)
      }
      // 고유한 게 하나도 없을 때를 대비해 겹침이 가장 적은 것을 기억
      if (!best || clash.length + 1 < best.overlap) {
        best = { frag, overlap: clash.length + 1, clash: clash.map((c) => c.key) };
      }
    }

    if (!best) {
      report.push({ key: o.key, frag: null, overlap: 0, text: o.text, why: "후보 없음" });
      continue;
    }
    result[o.key] = { frag: best.frag, overlap: best.overlap };
    report.push({ key: o.key, frag: best.frag, overlap: best.overlap, clash: best.clash, text: o.text });
  }

  /* ── 보고서 ── */
  const uniq = report.filter((r) => r.overlap === 1).length;
  const over = report.filter((r) => r.overlap > 1);
  const fail = report.filter((r) => !r.frag);
  const lens = report.filter((r) => r.frag).map((r) => r.frag.length);
  const avg = (lens.reduce((a, b) => a + b, 0) / lens.length).toFixed(1);

  console.log(`\n═══ ${lang}`);
  console.log(`  옵션 ${report.length}개 · 고유 ${uniq} · 겹침 ${over.length} · 실패 ${fail.length}`);
  console.log(`  조각 길이 평균 ${avg}자 (최장 ${Math.max(...lens)}자)`);
  if (fail.length) {
    console.log("  ✗ 조각을 못 만든 옵션:");
    for (const r of fail) console.log(`     ${r.key} :: ${r.text}`);
  }
  if (over.length) {
    console.log("  ⚠ 겹치는 조각:");
    for (const r of over) console.log(`     ${r.key}  "${r.frag}"  (${r.overlap}개) ← ${r.clash.join(", ")}`);
  }
  if (verbose) {
    console.log("  ─── 전체");
    for (const r of report) {
      console.log(`     ${r.overlap === 1 ? "✓" : "⚠"} ${r.frag ?? "—"}`.padEnd(24) + ` ${r.key}`);
    }
  }

  writeFileSync(`scripts/out/frags-${lang}.json`, JSON.stringify(result, null, 1));
  return { lang, uniq, over: over.length, fail: fail.length, avg: +avg, max: Math.max(...lens) };
}

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const verbose = process.argv.includes("--report");
const langs = args.length ? args : LANGS;
const summary = langs.map((l) => generate(l, verbose));

console.log("\n═══ 요약");
console.log("언어  고유  겹침  실패  평균길이  최장");
for (const s of summary) {
  console.log(
    `${s.lang.padEnd(5)} ${String(s.uniq).padStart(4)} ${String(s.over).padStart(5)} ${String(s.fail).padStart(5)} ${String(s.avg).padStart(8)}자 ${String(s.max).padStart(4)}자`
  );
}
