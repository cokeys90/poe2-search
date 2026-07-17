// 검색 상태 → 인게임 검색어(정규식).
//
// App에서 빼냈다. 즐겨찾기 카드도 이걸 부른다 — 저장해 둔 완성 문자열을 보여주면
// 언어를 바꿨을 때 옛 언어의 검색어가 그대로 남기 때문에, 저장은 조건만 하고 검색어는 매번 만든다.
//
// 게임 문법: 각 검색 세트를 " "로 감싸고 공백으로 구분 (공백 = AND)

import { BY_KEY, TOKENS, tabletImplicit } from "../data/options.js";
import { piece, pricePiece, tierPiece, meansAbsent } from "./regex.js";

// 포함 옵션이 필수(AND)인가 선택(OR)인가. 옵션별 req가 우선, 없으면 전역 mode로 폴백.
// (옛 저장분·golden/test 스크립트는 req 없이 mode만 넘기므로 이 폴백으로 동작이 보존된다)
const req_ = (s, mode) => s.req ?? mode === "and";

// sel: { [key]: {mode:"inc"|"exc", min} } — 옵션 본문은 key로 데이터에서 되살린다
// uses: { on, min } — 서판 고정 옵션(잔여 사용 횟수). 서판 탭에서만 쓴다.
export function buildPattern({ tab, tabletType, sel, mode, tier, corrupt, price, uses }) {
  const req = []; // 필수 — 각자 한 세트로 AND 결합
  const opt = []; // 선택 — 한 세트 안에서 | 로 묶어 "하나라도" (OR)
  const exc = [];

  for (const [key, s] of Object.entries(sel || {})) {
    const item = BY_KEY.get(key);
    if (!item) continue; // 데이터에서 사라진 옵션(옛 저장분)은 건너뛴다
    const opts = {
      openMax: item.openMax,
      rmin: item.rmin,
      rmax: item.rmax,
      noPercent: item.noPercent,
    };
    const p = piece(item.frag, s.min, s.max, item.text, opts);

    // ⚠️ "최대 0"처럼 그 모드가 **없어야** 한다는 조건은 인게임에선 제외 검색이라야 한다.
    //    0%인 무리 규모는 줄이 아예 안 뜨므로 "무리.*0%"는 영원히 안 잡힌다 → "!무리"가 맞다.
    //    (거래소는 max:0을 그대로 이해하므로 내보내기는 손대지 않는다)
    const absent = meansAbsent(s.min, s.max, item.text, opts);
    if (s.mode === "inc" && !absent) {
      // 옵션별 필수/선택이 우선. 없으면 전역 mode로 폴백(옛 저장분·스크립트 호환).
      (req_(s, mode) ? req : opt).push(p);
    } else exc.push(p);
  }

  const sets = [];
  req.forEach((p) => sets.push('"' + p + '"'));
  if (opt.length) sets.push('"' + opt.join("|") + '"'); // 하나뿐이면 join이 그 조각만 낸다
  exc.forEach((p) => sets.push('"!' + p + '"'));

  // 서판 고정 옵션 — 종류마다 늘 붙어 있는 "지도에 … 추가 / 잔여 사용 횟수 N회".
  // 안 쓴 서판(10회)만 찾는 게 거래의 기본이라 화면에서 기본 선택이다.
  if (tab === "tablet" && uses?.on) {
    const it = tabletImplicit(tabletType);
    if (it) sets.push('"' + piece(it.frag, uses.min, uses.max, it.text, {}) + '"');
  }

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
