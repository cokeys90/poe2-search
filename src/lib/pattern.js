// 검색 상태 → 인게임 검색어(정규식).
//
// App에서 빼냈다. 즐겨찾기 카드도 이걸 부른다 — 저장해 둔 완성 문자열을 보여주면
// 언어를 바꿨을 때 옛 언어의 검색어가 그대로 남기 때문에, 저장은 조건만 하고 검색어는 매번 만든다.
//
// 게임 문법: 각 검색 세트를 " "로 감싸고 공백으로 구분 (공백 = AND)

import { BY_KEY, TOKENS } from "../data/options.js";
import { piece, pricePiece, tierPiece } from "./regex.js";

// sel: { [key]: {mode:"inc"|"exc", min} } — 옵션 본문은 key로 데이터에서 되살린다
export function buildPattern({ tab, sel, mode, tier, corrupt, price }) {
  const inc = [];
  const exc = [];

  for (const [key, s] of Object.entries(sel || {})) {
    const item = BY_KEY.get(key);
    if (!item) continue; // 데이터에서 사라진 옵션(옛 저장분)은 건너뛴다
    const p = piece(item.frag, s.min, item.text, {
      openMax: item.openMax,
      rmin: item.rmin,
      rmax: item.rmax,
      noPercent: item.noPercent,
    });
    if (s.mode === "inc") inc.push(p);
    else exc.push(p);
  }

  const sets = [];
  if (inc.length) {
    if (mode === "or") sets.push('"' + inc.join("|") + '"');
    else inc.forEach((p) => sets.push('"' + p + '"'));
  }
  exc.forEach((p) => sets.push('"!' + p + '"'));

  // 등급(경로석 전용) · 타락 · 가격 = 독립 검색 세트로 AND 결합
  if (tab === "waystone") {
    const tp = tierPiece(tier);
    if (tp) sets.push('"' + tp + '"');
  }
  if (corrupt === "yes") sets.push('"' + TOKENS.corrupted + '"');
  else if (corrupt === "no") sets.push('"!' + TOKENS.corrupted + '"');

  const pp = pricePiece(price);
  if (pp) sets.push('"' + pp + '"');

  return sets.join(" ");
}
