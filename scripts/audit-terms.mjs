// 게임 용어 점검 — 우리가 화면에 쓰는 게임 용어가 poe2db(=게임 원문)와 같은가.
//
//   node scripts/audit-terms.mjs
//
// 왜 — 옵션 원문·조각은 poe2db에서 오지만, 화면의 게임 용어("접두어" "타락" "경로석")는
// 손번역이 섞여 있었다. 번역이 어긋나면 사용자가 게임 화면과 우리 화면을 대조하지 못한다.
// (검색어에 직접 박히는 건 tokens와 옵션 원문뿐이라 검색이 깨지진 않지만, 신뢰가 깨진다)
//
// poe2db에서 가져올 수 있는 것:
//   접두어/접미어 — 모드 표의 2번째 열 (<td>이름</td><td>접두어</td><td>원문</td>)
//   서판/경로석    — 기본 타입명에서 유도 (로케일의 bases, 이미 거래소 API로 검증됨)

import { readFileSync } from "node:fs";
import { itemWords } from "./lib/item-words.mjs";

const LANGS = ["kr", "us", "jp", "tw", "ru", "pt", "th", "fr", "de", "sp"];
const UA = "Mozilla/5.0 (poe2-search audit; https://github.com/cokeys90/poe2-search)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 모드 표의 접사 종류 열에서 가장 많이 나오는 두 값이 접두/접미다 (67개 / 59개)
async function affixLabels(lang) {
  const res = await fetch(`https://poe2db.tw/${lang}/Waystones`, { headers: { "User-Agent": UA } });
  const html = await res.text();
  const count = new Map();
  for (const m of html.matchAll(/<\/td><td>([^<]{2,24})<\/td><td>/g)) {
    const v = m[1].trim();
    count.set(v, (count.get(v) || 0) + 1);
  }
  const top = [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
  // 개수로 가른다 — 접두 67 / 접미 59 (poe2db의 경로석 모드 수)
  return { prefix: top[0]?.[0], suffix: top[1]?.[0], counts: top.map(([, n]) => n) };
}

// 같은 낱말인가 — 복수형·격변화는 통과시킨다 (내비게이션은 복수형이 자연스럽다:
// "Tablets" vs "Tablet", "Плитки" vs "плитка"). 아예 다른 낱말만 잡아내는 게 목적이다.
function sameWord(ours, theirs) {
  if (!ours || !theirs) return false;
  const a = ours.toLowerCase();
  const b = theirs.toLowerCase();
  if (a.includes(b) || b.includes(a)) return true;

  // 낱말이 여럿인 이름("Pierre de téléportation")은 통째로 비교하면 어간이 묻힌다 → 낱말끼리 본다
  const split = (s) => s.split(/[\s\-–—]+/).filter(Boolean);
  const ta = split(a);
  const tb = split(b);
  if (ta.length !== tb.length) return false;
  return ta.every((x, i) => {
    const y = tb[i];
    let n = 0;
    while (n < x.length && n < y.length && x[n] === y[n]) n++;
    return n / Math.min(x.length, y.length) >= 0.6; // 어간이 같으면 같은 낱말 (복수형·격변화)
  });
}

const rows = [];
let bad = 0;

for (const lang of LANGS) {
  const ui = JSON.parse(readFileSync(`src/i18n/${lang}.json`, "utf8"));
  const locale = JSON.parse(readFileSync(`src/data/locales/${lang}.json`, "utf8"));
  const ig = JSON.parse(readFileSync("scripts/data/ingame-waystone.json", "utf8"))[lang];

  const affix = await affixLabels(lang);
  const words = itemWords(locale);

  // exact: 글자까지 같아야 하는 것 / word: 같은 낱말이면 된다(복수형 허용)
  const check = (what, ours, theirs, source, mode = "exact") => {
    const ok =
      theirs != null && (mode === "exact" ? ours === theirs : sameWord(ours, theirs));
    if (!ok) bad++;
    rows.push([ok ? "  " : "❌", lang, what, ours ?? "(없음)", theirs ?? "(못 가져옴)", source]);
  };

  check("group.prefix", ui["group.prefix"], affix.prefix, "poe2db 모드표");
  check("group.suffix", ui["group.suffix"], affix.suffix, "poe2db 모드표");
  // 내비게이션은 복수형이 자연스럽다 → 같은 낱말인지만 본다
  check("nav.tablet", ui["nav.tablet"], words.tablet, "bases (poe2db)", "word");
  check("nav.waystone", ui["nav.waystone"], words.waystone, "bases (poe2db)", "word");
  check("filter.corrupt", ui["filter.corrupt"], ig.corrupted, "인게임 캡처");
  // 등급 라벨 — 검색어에 박히는 틀("{n}등급" / "Palier {n}")에서 숫자를 떼면 그 낱말이다
  check(
    "filter.tier",
    ui["filter.tier"],
    ig.tierSearch.replace("{n}", "").trim(),
    "인게임 캡처",
    "word"
  );

  await sleep(1200); // poe2db 예의
}

const w = (s, n) => String(s).padEnd(n);
console.log(
  `${w("", 3)}${w("언어", 5)}${w("키", 16)}${w("우리 화면", 26)}${w("게임 원문", 26)}출처`
);
for (const r of rows) console.log(`${w(r[0], 3)}${w(r[1], 5)}${w(r[2], 16)}${w(r[3], 26)}${w(r[4], 26)}${r[5]}`);

console.log(bad ? `\n어긋남 ${bad}건` : "\n전부 일치");
process.exit(bad ? 1 : 0);
