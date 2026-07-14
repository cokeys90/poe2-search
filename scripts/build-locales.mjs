// poe2db 수집본 + 인게임 캡처 → 우리 126개 옵션의 10개 언어 원문.
//
//   node scripts/scrape-poe2db.mjs          # 통합표 (경로석/서판)
//   node scripts/scrape-tablet-types.mjs {lang} …   # 종류별 페이지 (고정 옵션 + 소속)
//   node scripts/build-locales.mjs
//   → scripts/out/texts.json   { [key]: { us, kr, jp, … } }
//
// ── 소스를 왜 섞는가 ────────────────────────────────────────────
// · 접두·접미(경로석/서판): **통합표**(/Waystones, /Tablet). 모든 언어가 완전하고
//   언어 간 고유 모드 수·순서가 정확히 일치한다(검증됨).
//   종류별 페이지는 pt·th 데이터가 빠져 있어(심연 us 33개 vs pt 23개) 텍스트 소스로 못 쓴다.
// · 경로석 상단 6옵션: 여러 모드의 합산 값이라 poe2db에 없다 → 인게임 캡처(scripts/data/ingame-waystone.json)
// · 서판 고정 옵션 8개: 종류별 페이지의 아이템 카드 헤더
// · 심연 "접근 효과 범위": 통합표(=선도자 탑 모드)에 없다 → 종류별 페이지에서 ModFamilyList로 찾는다
//
// ── 정렬 ────────────────────────────────────────────────────────
// 통합표는 티어별로 여러 행이라 "수치를 지운 설명 전체"로 접어 고유 모드 목록을 만든다.
// 그 목록의 개수·순서가 언어 간 정확히 같으므로 인덱스로 맞춘다.
// 수치 범위는 티어 전체의 합집합을 쓴다 — 첫 티어만 쓰면 상한이 낮아 높게 굴려진 매물을 놓친다.

import { readFileSync, writeFileSync } from "node:fs";
import { DATA, TABLET_TYPES } from "../src/data/options.js";
import { LANGS } from "./langs.mjs";

const raw = Object.fromEntries(
  LANGS.map((l) => [l, JSON.parse(readFileSync(`scripts/out/raw-${l}.json`, "utf8"))])
);
const ingame = JSON.parse(readFileSync("scripts/data/ingame-waystone.json", "utf8"));

const RANGE = /\((-?\d+)[—–-](-?\d+)\)/;
const RANGE_G = /\((-?\d+)[—–-](-?\d+)\)/g;
const norm = (t) => t.replace(RANGE_G, "#").replace(/-?\d+/g, "#").replace(/\s+/g, " ").trim();
const fold = (r) => (r.lines || [r.text]).map(norm).join(" ¶ ");

/* ── 통합표: 언어별 고유 모드 목록 (티어 접기 + 범위 합집합) ───────── */
function distinct(lang, pool) {
  const seen = new Map();
  for (const r of raw[lang][pool].rows) {
    if (!r.text) continue;
    const k = fold(r);
    const m = r.text.match(RANGE);
    if (!seen.has(k)) {
      seen.set(k, { ...r, span: m ? [+m[1], +m[2]] : null });
    } else if (m) {
      const cur = seen.get(k);
      cur.span = cur.span
        ? [Math.min(cur.span[0], +m[1]), Math.max(cur.span[1], +m[2])]
        : [+m[1], +m[2]];
    }
  }
  // 대표 원문의 범위를 합집합으로 바꿔 둔다
  return [...seen.values()].map((r) => ({
    ...r,
    text: r.span ? r.text.replace(RANGE, `(${r.span[0]}—${r.span[1]})`) : r.text,
  }));
}

const MODS = {};
for (const pool of ["waystone", "tablet"]) {
  MODS[pool] = Object.fromEntries(LANGS.map((l) => [l, distinct(l, pool)]));
  const sizes = LANGS.map((l) => MODS[pool][l].length);
  if (new Set(sizes).size !== 1) {
    console.error(`✗ ${pool}: 언어별 고유 모드 수가 다르다 → 정렬 불가`);
    console.error("  " + LANGS.map((l, i) => `${l}=${sizes[i]}`).join(" "));
    process.exit(1);
  }
  console.error(`✓ ${pool}: 고유 모드 ${sizes[0]}개 — ${LANGS.length}개 언어 모두 동일`);
}

/* ── 우리 옵션 → 통합표 인덱스 (kr 텍스트로 대조) ─────────────────
   우리 text는 복합 모드의 '실제 옵션 줄' 하나뿐인데(§3-4) 통합표는 부가 옵션 줄까지 준다
   → 통합표 행의 '어느 줄이든' 우리 text와 같으면 그 모드로 본다.
   같은 문장이 여럿이면(접두/접미에 같은 줄) 접두·접미로 가른다. */
const AFFIX = { prefix: "접두어", suffix: "접미어" };

function findIdx(pool, affix, it) {
  const mods = MODS[pool].kr;
  const want = norm(it.text);
  let hits = mods
    .map((m, i) => [m, i])
    .filter(([m]) => m.affix === affix && (m.lines || [m.text]).some((l) => norm(l) === want));

  // 같은 문장이 복합 모드와 단독 모드 양쪽에 있다("지도에 성소 1개 추가 등장" — 공통 접미 복합 vs 감독관 고유).
  // 우리 데이터의 부가 옵션(extra) 개수로 가른다: 복합 모드는 줄이 1 + extra.length 개다.
  if (hits.length > 1) {
    const want = 1 + (it.extra?.length ?? 0);
    hits = hits.filter(([m]) => (m.lines || [m.text]).length === want);
  }
  return hits.length === 1 ? hits[0][1] : -1;
}

const ours = [
  ...DATA.waystone.prefix.map((it) => ["waystone", AFFIX.prefix, it]),
  ...DATA.waystone.suffix.map((it) => ["waystone", AFFIX.suffix, it]),
  ...DATA.tablet.prefix.map((it) => ["tablet", AFFIX.prefix, it]),
  ...DATA.tablet.suffix.map((it) => ["tablet", AFFIX.suffix, it]),
  ...Object.values(DATA.tablet.unique).flat().map((it) => ["tablet", AFFIX.suffix, it]),
];

const texts = {};
const missing = [];

for (const [pool, affix, it] of ours) {
  const i = findIdx(pool, affix, it);
  if (i < 0) {
    missing.push(`${it.key} :: ${it.text}`);
    continue;
  }
  // 통합표 행은 여러 줄일 수 있다 → 우리가 쓰는 '실제 옵션 줄'을 언어별로 골라야 한다.
  // 줄 번호는 언어 간 같다(같은 모드의 같은 스탯 순서) → kr에서 찾은 줄 번호를 그대로 쓴다.
  const krLines = MODS[pool].kr[i].lines || [MODS[pool].kr[i].text];
  const li = krLines.findIndex((l) => norm(l) === norm(it.text));
  texts[it.key] = Object.fromEntries(
    LANGS.map((l) => {
      const m = MODS[pool][l][i];
      const lines = m.lines || [m.text];
      let t = lines[li] ?? lines[lines.length - 1];
      // 대표 행의 범위 합집합을 그 줄에도 반영
      if (m.span && RANGE.test(t)) t = t.replace(RANGE, `(${m.span[0]}—${m.span[1]})`);
      return [l, t];
    })
  );
}

/* ── 경로석 상단 6옵션: 인게임 캡처 ───────────────────────────── */
for (const it of DATA.waystone.implicit) {
  texts[it.key] = Object.fromEntries(
    LANGS.map((l) => [l, ingame[l]?.implicit?.[it.key] ?? null])
  );
  if (LANGS.some((l) => !texts[it.key][l])) missing.push(`${it.key} (인게임 캡처 누락)`);
}

/* ── 서판 고정 옵션 8개 + 심연 "접근 효과 범위": 종류별 페이지 ──────
   고정 옵션은 아이템 카드에, 나머지는 모드 목록에 있다.
   심연 "접근 효과 범위"는 통합표(=선도자 탑 모드)에 없어 여기서만 얻는다.
   언어 간 대조는 ModFamilyList로 한다 — 언어 무관 식별자다. */
const types = Object.fromEntries(
  LANGS.map((l) => [l, JSON.parse(readFileSync(`scripts/out/tablet-types-${l}.json`, "utf8"))])
);

// 새 서판은 10회이고 쓸수록 줄어든다 → 가능 범위 (1—10). 표시된 "10"만 범위로 바꾼다.
// (앞줄의 "1개 추가"까지 건드리면 안 되므로 마지막 "10"만 교체한다.)
const usesRange = (s) => {
  const i = s.lastIndexOf("10");
  return i < 0 ? s : s.slice(0, i) + "(1—10)" + s.slice(i + 2);
};

for (const slug of TABLET_TYPES) {
  const key = `tb.impl.${slug}`;
  texts[key] = Object.fromEntries(
    LANGS.map((l) => {
      const lines = types[l].implicits?.[slug];
      return [l, lines?.length ? usesRange(lines.join(" / ")) : null];
    })
  );
  if (LANGS.some((l) => !texts[key][l])) missing.push(`${key} (고정 옵션 못 찾음)`);
}

// ⚠️ 종류별 페이지의 '텍스트'는 쓰지 않는다. poe2db 한국어 페이지는 심연 모드에서
//    ModFamilyList와 텍스트의 정렬이 한 칸 밀려 있다 — 같은 family(AbyssExtraTickets)가
//    한국어에선 "접근 효과 범위 100% 감소", 영어에선 "Desecrated Currency"로 나온다.
//    실재하지 않는 유령 옵션을 데이터에 넣을 뻔했다. 텍스트는 통합표만 믿는다.

console.error(`\n대조: ${Object.keys(texts).length}개 / 우리 옵션 ${ours.length + DATA.waystone.implicit.length}개`);
if (missing.length) {
  console.error(`✗ 못 붙인 것 ${missing.length}개:`);
  for (const m of missing) console.error("  " + m);
}

writeFileSync("scripts/out/texts.json", JSON.stringify(texts, null, 1));
console.error("\n→ scripts/out/texts.json");

const sample = "ws.pre.deal_extra_fire";
console.error(`\n[샘플] ${sample}`);
for (const l of LANGS) console.error(`  ${l}: ${texts[sample]?.[l]}`);
