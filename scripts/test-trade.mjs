// 거래소 왕복 테스트 — 내보낸 조건이 그대로 되돌아오는가. 네트워크를 쓰지 않는다.
//
//   node scripts/test-trade.mjs
//
// 덮는 것 (F-06 거래소 내보내기 / F-07 거래소 가져오기):
//   · 조건(옵션·수치·제외·OR/AND·등급·타락·가격·잔여횟수)이 URL을 거쳐 손실 없이 돌아오는가
//   · 거래소 3곳 × 10개 언어에서 도메인·리그·기본 타입명이 맞는가
//   · 거래소에 없는 옵션은 조용히 빠지지 않고 skipped로 보고되는가
//
// 왜 왕복인가 — 내보내기만 보면 "거래소가 알아들었는지"를 알 수 없다. 우리가 만든 JSON을
// 우리 파서로 되읽어 원래 상태와 맞춰 보면 매핑의 앞뒤가 어긋난 곳이 드러난다.

import "./fs-locales.mjs";
import { readFileSync } from "node:fs";
import { tradeUrl, queryToState, TRADE_SITES, siteForLang, importLangs, tradeOrigin } from "../src/lib/trade.js";
import { ensureBases, setLang, BY_KEY, DEFAULT_USES } from "../src/data/options.js";
import { CURRENCIES } from "../src/lib/currency.js";
import { buildPattern } from "../src/lib/pattern.js";

const LANGS = ["kr", "us", "jp", "tw", "ru", "pt", "th", "fr", "de", "sp"];

let fail = 0;
const bad = (msg) => {
  fail++;
  console.log(`❌ ${msg}`);
};

const parseQ = (url) => JSON.parse(decodeURIComponent(url.split("?q=")[1]));

/* ── 1. 왕복: 조건이 손실 없이 돌아오는가 ───────────────────────── */

const CASES = [
  {
    name: "서판/균열 · AND · 수치 · 제외 · 잔여10",
    state: {
      tab: "tablet",
      tabletType: "breach",
      sel: {
        "tb.breach.pack_size": { mode: "inc", min: "20" },
        "tb.pre.rarity_items_found": { mode: "exc", min: "" },
      },
      mode: "and",
      uses: { on: true, min: "10" },
      price: { enabled: false, mode: "exact", min: "", max: "", currency: "exalted" },
      corrupt: "any",
      tier: "",
    },
  },
  {
    name: "서판/심연 · OR · 타락제외",
    state: {
      tab: "tablet",
      tabletType: "abyss",
      sel: { "tb.suf.quantity_waystones_found": { mode: "inc", min: "35" } },
      mode: "or",
      uses: { on: true, min: DEFAULT_USES },
      price: { enabled: false, mode: "exact", min: "", max: "", currency: "exalted" },
      corrupt: "no",
      tier: "",
    },
  },
  {
    // 실제로 겪은 케이스 — 거래소에서 "무리 규모 최대 0"(= 무리 규모가 없는 것)으로 걸어 오면
    // 예전엔 min만 읽어서 값 없이 옵션만 켜졌다 → 검색어가 "무리"가 돼 **정반대**를 찾았다.
    name: "경로석 · 최대만(무리 규모 0) · 최소만 · 최소~최대",
    state: {
      tab: "waystone",
      tabletType: null,
      sel: {
        "ws.imp.pack_size": { mode: "inc", min: "", max: "0" },
        "ws.imp.item_rarity": { mode: "inc", min: "55", max: "" },
        "ws.imp.revives": { mode: "inc", min: "1", max: "3" },
      },
      mode: "and",
      uses: { on: false, min: DEFAULT_USES },
      price: { enabled: false, mode: "exact", min: "", max: "", currency: "exalted" },
      corrupt: "any",
      tier: "15",
    },
  },
  {
    name: "경로석/15등급 · 상단옵션(엔드게임 필터) · 가격범위",
    state: {
      tab: "waystone",
      tabletType: null,
      sel: {
        "ws.imp.item_rarity": { mode: "inc", min: "40" },
        "ws.pre.deal_extra_fire": { mode: "inc", min: "8" },
      },
      mode: "and",
      uses: { on: false, min: DEFAULT_USES },
      price: { enabled: true, mode: "range", min: "5", max: "40", currency: "divine" },
      corrupt: "yes",
      tier: "15",
    },
  },
];

// 왕복이 보존해야 하는 것만 비교한다 (uses는 서판에서만, tier는 경로석에서만 의미가 있다)
function compare(name, before, after) {
  const keys = Object.keys(before.sel);
  for (const k of keys) {
    const a = before.sel[k];
    const b = after.sel[k];
    if (!b) {
      bad(`${name}: 옵션 ${k}가 왕복에서 사라졌다`);
      continue;
    }
    if (a.mode !== b.mode) bad(`${name}: ${k} 모드 ${a.mode} → ${b.mode}`);
    if (String(a.min) !== String(b.min)) bad(`${name}: ${k} 값 "${a.min}" → "${b.min}"`);
  }
  const extra = Object.keys(after.sel).filter((k) => !keys.includes(k));
  if (extra.length) bad(`${name}: 없던 옵션이 생겼다 — ${extra.join(", ")}`);

  if (before.tab !== after.tab) bad(`${name}: 탭 ${before.tab} → ${after.tab}`);
  if (before.mode !== after.mode) bad(`${name}: 결합 ${before.mode} → ${after.mode}`);
  if (before.corrupt !== after.corrupt) bad(`${name}: 타락 ${before.corrupt} → ${after.corrupt}`);
  if (before.tab === "tablet" && before.tabletType !== after.tabletType)
    bad(`${name}: 서판 종류 ${before.tabletType} → ${after.tabletType}`);
  if (before.tab === "waystone" && String(before.tier) !== String(after.tier))
    bad(`${name}: 등급 ${before.tier} → ${after.tier}`);
  if (before.tab === "tablet" && before.uses.on !== after.uses.on)
    bad(`${name}: 잔여횟수 켬 ${before.uses.on} → ${after.uses.on}`);
  if (before.tab === "tablet" && before.uses.on && String(before.uses.min) !== String(after.uses.min))
    bad(`${name}: 잔여횟수 ${before.uses.min} → ${after.uses.min}`);

  const p = before.price;
  const q = after.price;
  if (p.enabled !== q.enabled) bad(`${name}: 가격 켬 ${p.enabled} → ${q.enabled}`);
  if (p.enabled) {
    if (p.currency !== q.currency) bad(`${name}: 화폐 ${p.currency} → ${q.currency}`);
    if (String(p.min) !== String(q.min)) bad(`${name}: 가격 최소 ${p.min} → ${q.min}`);
    if (String(p.max) !== String(q.max)) bad(`${name}: 가격 최대 ${p.max} → ${q.max}`);
  }
}

await Promise.all(importLangs("kr").map(ensureBases));

for (const site of Object.keys(TRADE_SITES)) {
  for (const c of CASES) {
    const { url, skipped } = tradeUrl({ ...c.state, site, lang: "kr" });
    const { state } = queryToState(parseQ(url).query);
    compare(`[${site}] ${c.name}`, c.state, state);
    if (skipped.length) bad(`[${site}] ${c.name}: 거래소로 못 보낸 옵션 ${skipped.length}개 — ${skipped}`);
  }
}
console.log(`왕복 — 거래소 ${Object.keys(TRADE_SITES).length}곳 × 케이스 ${CASES.length}개`);

/* ── 2. 언어별 도메인·타입명 ────────────────────────────────────── */

await Promise.all(LANGS.map(ensureBases));

for (const lang of LANGS) {
  const site = siteForLang(lang);
  const { url } = tradeUrl({
    tab: "tablet",
    tabletType: "breach",
    sel: {},
    mode: "and",
    uses: { on: true, min: "10" },
    price: { enabled: false },
    corrupt: "any",
    site,
    lang,
  });
  const q = parseQ(url);
  const host = new URL(url).host;
  const S = TRADE_SITES[site];
  const league = decodeURIComponent(url.split("/poe2/")[1].split("?")[0]);

  if (!q.query.type) bad(`${lang}: 기본 타입명이 비었다 (서판 8종이 다 섞인다)`);
  if (!S.leagues.some((l) => l.id === league)) bad(`${lang}: 리그 "${league}"가 ${site}에 없다`);
  if (!host.includes("pathofexile") && !host.includes("kakaogames"))
    bad(`${lang}: 알 수 없는 거래소 도메인 ${host}`);
}
console.log(`도메인·타입명 — ${LANGS.length}개 언어`);

/* ── 3. 거래소에 못 보내는 옵션은 조용히 빠지지 않는가 ──────────── */

// stat_id도 map_filter도 없는 옵션은 거래소로 못 보낸다 → skipped에 반드시 담겨야 한다
const noTrade = [...BY_KEY.values()].filter((o) => !o.stat_id && !o.map_filter);
if (noTrade.length) {
  const one = noTrade[0];
  const isTablet = one.key.startsWith("tb.");
  const { skipped } = tradeUrl({
    tab: isTablet ? "tablet" : "waystone",
    tabletType: "breach",
    sel: { [one.key]: { mode: "inc", min: "" } },
    mode: "and",
    uses: { on: false },
    price: { enabled: false },
    corrupt: "any",
    site: "kakao",
    lang: "kr",
  });
  if (!skipped.length) bad(`거래소명 없는 옵션(${one.key})이 skipped에 안 담겼다 — 조용히 사라진다`);
}
console.log(`거래소로 못 보내는 옵션 ${noTrade.length}개 — 전부 사용자에게 보고됨`);

/* ── 4. 워커의 허용 목록이 앱이 실제로 부르는 거래소를 다 덮는가 ── */

// 스탯 이름표 프록시(worker/index.js)는 오픈 프록시가 되지 않도록 거래소만 허용한다.
// 그 목록이 앱의 서브도메인 표와 어긋나면 조회가 조용히 400을 받는다 → 이름표 대신 stat id가 뜬다.
const worker = readFileSync("worker/index.js", "utf8");
const subs = worker.match(/const GLOBAL_SUBS = \[([^\]]+)\]/)?.[1] ?? "";
const allowed = new Set([
  ...[...subs.matchAll(/"([^"]+)"/g)].map((m) => `https://${m[1]}.pathofexile.com`),
  ...[...worker.matchAll(/"(https:\/\/(?:pathofexile\.tw|poe\.kakaogames\.com))"/g)].map((m) => m[1]),
]);

for (const lang of LANGS) {
  for (const site of Object.keys(TRADE_SITES)) {
    const o = tradeOrigin(site, lang);
    if (!allowed.has(o)) bad(`워커가 ${o}를 허용하지 않는다 (${lang} × ${site}) — 이름표 조회가 400`);
  }
}
console.log(`워커 허용 목록 — 앱이 부르는 거래소 ${allowed.size}곳 전부 덮음`);

/* ── 5. 화폐 — 거래소 option 매핑과 인게임 표현 ─────────────────── */

// "엑잘티드 오브 상당"은 거래소가 환산해 주는 개념이다 → query에 option을 **안 넣는 것**이 곧 그것이다.
// 인게임엔 그런 개념이 없다 → 검색어에서 가격 세트가 빠져야 한다. 엑잘로 둔갑시키면 안 된다.
for (const c of CURRENCIES) {
  const state = {
    tab: "waystone",
    tier: "15",
    sel: {},
    mode: "and",
    corrupt: "any",
    price: { enabled: true, mode: "exact", min: "3", max: "", currency: c.key },
  };
  const q = parseQ(tradeUrl({ ...state, site: "kakao", lang: "kr" }).url);
  const opt = q.query.filters?.trade_filters?.filters?.price?.option;

  if (c.trade == null && opt !== undefined)
    bad(`${c.key}: 거래소 option이 들어갔다("${opt}") — 상당은 option을 빼야 환산된다`);
  if (c.trade != null && opt !== c.trade) bad(`${c.key}: 거래소 option "${opt}" ≠ "${c.trade}"`);

  // 왕복
  const back = queryToState(q.query).state.price.currency;
  if (back !== c.key) bad(`${c.key}: 왕복에서 "${back}"이 됐다`);

  // 인게임 검색어
  const pat = buildPattern(state);
  const hasPrice = /\\b3 /.test(pat);
  if (c.ingame == null && hasPrice)
    bad(`${c.key}: 인게임 검색어에 가격이 들어갔다 — 게임엔 그런 화폐 표기가 없다`);
  if (c.ingame != null && !hasPrice) bad(`${c.key}: 인게임 검색어에 가격이 빠졌다`);
  if (c.ingame != null && !pat.includes(c.ingame)) bad(`${c.key}: 인게임 표기 "${c.ingame}" 없음`);
}
console.log(`화폐 ${CURRENCIES.length}종 — 거래소 option · 왕복 · 인게임 표현`);

console.log(fail ? `\n실패 ${fail}건` : "\n전부 통과");
process.exit(fail ? 1 : 0);
