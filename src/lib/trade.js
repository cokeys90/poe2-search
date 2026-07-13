import { DATA } from "../data/options.js";
import { optId } from "./options.js";

// 공식 거래소(카카오 PoE2) 링크 생성.
// 검색 조건을 ?q=<JSON>으로 실어 보내면 거래소가 알아서 검색을 실행하고
// URL 끝의 검색 ID(예: /6zWVPLP6sG)도 스스로 발급한다 → 우리가 API를 호출할 필요가 없다.
const BASE = "https://poe.kakaogames.com/trade2/search/poe2";

// 리그 목록은 /api/trade2/data/leagues에 있으나 CORS가 없어 브라우저에서 못 부른다 → 코드에 유지.
export const LEAGUES = [
  { id: "Runes of Aldur", label: "룬 오브 알두르" },
  { id: "HC Runes of Aldur", label: "룬 오브 알두르 (하드코어)" },
  { id: "Standard", label: "스탠다드" },
  { id: "Hardcore", label: "하드코어" },
];
export const DEFAULT_LEAGUE = "Runes of Aldur";

const CATEGORY = { waystone: "map.waystone", tablet: "map.tablet" };

// 옵션 원문 → 데이터 원본. 즐겨찾기 스냅샷은 stat_id가 없던 시절에 저장됐을 수 있어
// 저장값 대신 항상 현재 데이터에서 다시 찾는다.
const INDEX = (() => {
  const m = new Map();
  const add = (list) => list.forEach((it) => m.set(optId(it.text), it));
  add(DATA.waystone.implicit);
  add(DATA.waystone.prefix);
  add(DATA.waystone.suffix);
  add(DATA.tablet.common_prefix);
  add(DATA.tablet.common_suffix);
  Object.values(DATA.tablet.unique).forEach(add);
  return m;
})();

const num = (v) => {
  const n = parseInt(String(v ?? "").trim(), 10);
  return isNaN(n) ? null : n;
};

// 검색 상태(스냅샷) → 거래소 URL.
// 반환: { url, skipped: [거래소에 없는 옵션 원문] }
export function tradeUrl({ tab, sel, mode, price, corrupt, tier, league = DEFAULT_LEAGUE }) {
  const and = [];
  const not = [];
  const count = [];
  const mapFilters = {};
  const skipped = [];

  for (const [id, s] of Object.entries(sel || {})) {
    const item = INDEX.get(id) || s;
    const min = num(s.min);

    // 경로석 상단 6옵션은 스탯이 아니라 엔드게임 필터(map_iir 등)로 들어간다
    if (item.map_filter) {
      if (s.mode === "inc" && min != null) mapFilters[item.map_filter] = { min };
      else if (s.mode === "inc") mapFilters[item.map_filter] = { min: 1 }; // 값 없이 "있으면 됨"
      else skipped.push(item.text); // 거래소 필터엔 제외 개념이 없다
      continue;
    }

    if (!item.stat_id) {
      skipped.push(item.text); // 거래소 스탯명이 없는 옵션 (반대 부호 등 미검증 건)
      continue;
    }

    const f = { id: item.stat_id, disabled: false };
    if (s.mode === "exc") {
      not.push(f);
    } else {
      if (min != null) f.value = { min };
      // 우리 앱의 OR = 거래소의 "숫자(count)" 그룹 (최소 1개 충족)
      (mode === "or" ? count : and).push(f);
    }
  }

  const stats = [];
  if (and.length) stats.push({ type: "and", filters: and, disabled: false });
  if (not.length) stats.push({ type: "not", filters: not, disabled: false });
  if (count.length)
    stats.push({ type: "count", filters: count, value: { min: 1 }, disabled: false });

  // 경로석 등급
  const t = num(tier);
  if (tab === "waystone" && t != null) mapFilters.map_tier = { min: t, max: t };

  const filters = {
    type_filters: { filters: { category: { option: CATEGORY[tab] } } },
  };
  if (Object.keys(mapFilters).length) filters.map_filters = { filters: mapFilters };
  if (corrupt === "yes" || corrupt === "no")
    filters.misc_filters = { filters: { corrupted: { option: corrupt === "yes" } } };

  if (price?.enabled) {
    const lo = num(price.min);
    const hi = price.mode === "range" ? num(price.max) : lo;
    const p = {};
    if (lo != null) p.min = lo;
    if (hi != null) p.max = hi;
    if (Object.keys(p).length) {
      p.option = price.currency;
      filters.trade_filters = { filters: { price: p } };
    }
  }

  const q = {
    query: { status: { option: "securable" }, stats, filters },
    sort: { price: "asc" },
  };

  const url = `${BASE}/${encodeURIComponent(league)}?q=${encodeURIComponent(JSON.stringify(q))}`;
  return { url, skipped };
}
