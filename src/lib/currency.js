// 가격 화폐 — 인게임 검색어와 거래소가 같은 것을 다르게 쓴다. 한곳에 모아 둔다.
//
//   ingame : 게임 화면의 판매가에 찍히는 영어 표기. 여러 개면 (a|b)로 묶는다.
//            null이면 **인게임으로는 표현할 수 없다** → 검색어에서 가격 세트를 뺀다.
//   trade  : 거래소 query의 trade_filters.price.option.
//            null이면 **option을 아예 안 넣는다** — 그게 거래소의 "엑잘티드 오브 상당"이다.
//
// ⚠️ 화폐 표기는 언어와 무관하게 영어다(인게임 확인). key·ingame은 번역하지 않는다.
//    화면 라벨(i18n)만 언어를 따라간다.
//
// ⚠️ 거래소 드롭다운엔 12개가 있다(제왕·바알·연금술·소멸·확장·진화·거울…). 그것들을 넣지 않은 건
//    게임 화면에 어떤 글자로 찍히는지 근거가 없어서다 — 추측으로 넣으면 그 가격 검색이 조용히
//    빈다(CLAUDE.md §6-0). 근거를 찾으면 그때 넣는다.
export const CURRENCIES = [
  // 거래소가 모든 화폐를 엑잘 환산해 준다. 인게임엔 그런 개념이 없다 → 가격은 거래소에만 걸린다.
  { key: "equivalent", i18n: "currency.equivalent", ingame: null, trade: null, tradeOnly: true },
  { key: "exalted", i18n: "currency.exalted", ingame: "exalted", trade: "exalted" },
  { key: "divine", i18n: "currency.divine", ingame: "divine", trade: "divine" },
  { key: "chaos", i18n: "currency.chaos", ingame: "chaos", trade: "chaos" },
  {
    key: "exalted_divine",
    i18n: "currency.exalted_divine",
    ingame: "(exalted|divine)",
    trade: "exalted_divine",
  },
];

const BY_KEY = new Map(CURRENCIES.map((c) => [c.key, c]));
export const currency = (key) => BY_KEY.get(key) ?? BY_KEY.get("exalted");

// 거래소 option → 우리 key (가져오기). option이 없으면 "상당"이다.
export const currencyFromTrade = (option) =>
  option == null || option === ""
    ? "equivalent"
    : (CURRENCIES.find((c) => c.trade === option)?.key ?? "exalted");
