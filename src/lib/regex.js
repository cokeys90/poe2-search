// PoE2 경로석·서판 정규식 생성 로직 (poe2.re 방식)
// 범위 수치식: . 자리채움 + 첫자리 병합 + \d.. + [89] 압축
//
// 수치 계산 자체는 언어 무관하지만, 완성된 검색어에는 게임 내 단어가 그대로 들어간다
// ("15등급", "(1—2)개"). 그 단어들은 로케일의 tokens에서 가져온다.

import { TOKENS } from "../data/options.js";

/* ---------- 수치 범위 정규식 생성 (poe2.re 방식: . 자리채움) ---------- */
// [lo,hi] 정수 구간 최소 정규식. [0-9] 자리는 . 로 축약, 인접 첫자리는 [x-y]로 병합.
export function rangeRegex(lo, hi) {
  if (lo > hi) return "";
  let alts = [];
  let a = lo;
  while (a <= hi) {
    const L = String(a).length;
    const maxL = Math.pow(10, L) - 1;
    const b = Math.min(hi, maxL);
    recPad(a, b, L, alts);
    a = b + 1;
  }
  alts = mergeHeads(alts);
  const joined = alts.join("|");
  const out = alts.length > 1 ? "(" + joined + ")" : joined;
  return compressCls(out);
}
// 문자클래스 압축: [8-9]→[89], [9-9]→9, [1-9] 뒤에 .가 오면 \d (앞자리 0 값 없음). 글자 절약.
export function compressCls(s) {
  // [1-9] 다음에 . 이 오는 경우 → \d (예: [1-9].. → \d.. ). 게임 값에 099% 같은 앞자리0 없음.
  s = s.replace(/\[1-9\](?=\.)/g, "\\d");
  return s.replace(/\[(\d)-(\d)\]/g, (m, a, b) => {
    if (a === b) return a;                    // [5-5] → 5
    if (+b - +a === 1) return "[" + a + b + "]"; // [8-9] → [89]
    return m;
  });
}
// 같은 . 꼬리를 가진 [x-y]머리를 병합: [2-8].+9. → [2-9].
export function mergeHeads(alts) {
  const dotTail = a => { const m = a.match(/^(.*?)(\.+)$/); return m ? { head: m[1], tail: m[2] } : null; };
  const groups = {}, others = [];
  for (const a of alts) {
    const d = dotTail(a);
    if (d && /^(\[\d-\d\]|\d)$/.test(d.head)) (groups[d.tail] ||= []).push(d.head);
    else others.push(a);
  }
  const merged = [];
  for (const tail in groups) {
    const ranges = groups[tail].map(h => {
      if (h.length === 1) return [+h, +h];
      const m = h.match(/\[(\d)-(\d)\]/); return [+m[1], +m[2]];
    }).sort((x, y) => x[0] - y[0]);
    const out = []; let [lo, hi] = ranges[0];
    for (let i = 1; i < ranges.length; i++) {
      if (ranges[i][0] <= hi + 1) hi = Math.max(hi, ranges[i][1]);
      else { out.push([lo, hi]); [lo, hi] = ranges[i]; }
    }
    out.push([lo, hi]);
    for (const [a, b] of out) merged.push((a === b ? String(a) : "[" + a + "-" + b + "]") + tail);
  }
  return others.concat(merged);
}
export function recPad(lo, hi, len, out) {
  if (lo > hi) return;
  if (len === 1) { out.push(cls(lo, hi)); return; }
  const slo = String(lo).padStart(len, "0");
  const shi = String(hi).padStart(len, "0");
  const fa = +slo[0], fb = +shi[0];
  const restLen = len - 1;
  const maxRest = Math.pow(10, restLen) - 1;
  const loRest = +slo.slice(1), hiRest = +shi.slice(1);
  if (fa === fb) {
    out.push(String(fa) + subPattern(loRest, hiRest, restLen));
  } else {
    out.push(String(fa) + subPattern(loRest, maxRest, restLen));
    if (fb - fa >= 2) out.push(cls(fa + 1, fb - 1) + dots(restLen));
    out.push(String(fb) + subPattern(0, hiRest, restLen));
  }
}
export function subPattern(lo, hi, len) {
  if (len === 0) return "";
  const full = Math.pow(10, len) - 1;
  if (lo === 0 && hi === full) return dots(len);
  let out = [];
  recPad(lo, hi, len, out);
  out = mergeHeads(out);
  return out.length > 1 ? "(" + out.join("|") + ")" : out[0];
}
export function cls(a, b) { return a === b ? String(a) : "[" + a + "-" + b + "]"; }
export function dots(n) { return ".".repeat(n); }

// 옵션 원문에서 수치 범위 파싱. 범위 (a—b) 뒤의 단위는 언어마다 다르다(한국어: % 개 마리 초 …)
// → 로케일의 tokens.units 문자들만 단위로 인정한다. 파싱된 단위는 piece()에서 정규식에 다시 박힌다.
// 반환: {min, max, unit} 또는 null. 고정 개수형(범위 없는 "1개")은 null(이상 검색 무의미).
// ⚠️ 모듈 로드 시점에 만들어 두면 안 된다 — 언어가 바뀌면 단위 글자가 달라진다
// (kr "%개마리초…" / jp "%個回体秒" / 라틴은 "%"뿐). 언어별로 한 번씩만 만들어 재사용한다.
let rangeReCache = { units: null, re: null };
function rangeRe() {
  if (rangeReCache.units !== TOKENS.units) {
    rangeReCache = {
      units: TOKENS.units,
      re: new RegExp(
        "\\(([0-9]+)[—\\-–]([0-9]+)\\)\\s*([" + TOKENS.units.replace(/[\]\\^-]/g, "\\$&") + "]*)"
      ),
    };
  }
  return rangeReCache.re;
}

export function parseRange(text) {
  let m = text.match(rangeRe());
  if (m) return { min: +m[1], max: +m[2], unit: m[3] || "" };
  m = text.match(/(?:^|[^0-9(])([0-9]{1,3})\s*(%)/);
  if (m) return { min: +m[1], max: +m[1], unit: "%" };
  return null;
}
export function rangeMinMax(text) { return parseRange(text); }
export function rangeHint(text) {
  const r = parseRange(text);
  if (!r) return null;
  return r.min === r.max ? String(r.min) : (r.min + "-" + r.max);
}
export function hasNumeric(text) {
  return parseRange(text) != null;
}

// 가격 검색 세트 생성 (경로석·서판 공통). 상인 판매가를 영어 화폐명으로 매칭.
// 단어 경계 \b로 자릿수 경계 처리 → "\b50 chaos"가 150 chaos를 잘못 잡지 않음.
// (게임이 검색어 앞 공백은 잘라버려서 공백 경계는 안 통함 — \b 사용.)
// price: {enabled, mode:"exact"|"range", min, max, currency}  → 반환: "\b3 chaos" 등, 없으면 ""
// 가격 상한 — 옵션 수치(openMax)와 같은 3자리 관례
const PRICE_MAX = 999;

export function pricePiece(price) {
  if (!price || !price.enabled || !price.currency) return "";
  const cur = price.currency;
  const lo = parseInt(String(price.min).trim(), 10);
  const hi = parseInt(String(price.max).trim(), 10);

  if (price.mode === "range") {
    const hasLo = !isNaN(lo) && lo >= 0;
    const hasHi = !isNaN(hi) && hi >= 0;
    let rg;
    if (hasLo && hasHi) {
      if (hi < lo) return "";
      rg = rangeRegex(lo, hi);
    } else if (hasLo) {
      rg = rangeRegex(lo, PRICE_MAX); // 최소만 → "그 이상"
    } else if (hasHi) {
      rg = rangeRegex(0, hi); // 최대만 → "그 이하"
    } else {
      return "";
    }
    return rg ? "\\b" + rg + " " + cur : "";
  }
  // 정확히 lo개
  if (isNaN(lo) || lo < 0) return "";
  return "\\b" + lo + " " + cur;
}

// 경로석 등급 검색 세트.
// ⚠️ 어순이 언어마다 다르다 — 한국어 "15등급"(뒤) vs 영어 "Tier 15"(앞) vs 프랑스어 "Palier 15".
// 그래서 접미사가 아니라 틀({n})로 다룬다. 로케일의 tokens.tier가 그 틀이다.
// \b: "5등급"이 "15등급"에 오매칭되지 않게 하는 단어 경계 (인게임 확인).
// tier: 숫자 또는 ""/null(무관)  → 반환: "\b15등급" / "\bTier 15", 없으면 ""
export function tierPiece(tier) {
  const t = parseInt(String(tier).trim(), 10);
  if (isNaN(t) || t <= 0) return "";
  return "\\b" + TOKENS.tier.replace("{n}", String(t));
}

/* ---------- 수치를 조각에 붙이는 위치 ----------
   수치는 조각 뒤에 붙이면 되는 게 아니다. 원문에서 값이 조각 단어보다 앞에 오는 경우가 많다:

     "몬스터가 피해의 (5—9)%를 추가 화염 피해로 줌"   ← 값이 "화염"보다 앞
     "지도에서 발견하는 아이템 희귀도 (8—12)% 증가"    ← 값이 "템.희"보다 뒤

   앞 경우에 "화염.*[5-9]%"를 만들면 게임에서 절대 안 잡힌다.
   그래서 원문에서 값과 조각의 앞뒤를 보고 결합 순서를 정한다. (참조 엔진 poe2.re도 같은 방식이다 —
   접사는 "<수치>\(.*<조각>", 경로석 상단 스탯은 "m rar.*<수치>")

   값 뒤의 앵커: 게임의 "어드밴스드 모드 설명"을 켜면 값이 "10(8—12)%"로, 끄면 "10%"로 표시된다.
   숫자 뒤에 단위 또는 "(" 를 허용해 두 표시 방식 모두에서 잡히게 한다 → "1[0-2][%(]"        */

const RANGE_IN_TEXT = /\((-?\d+)[—–-](-?\d+)\)/;

// 조각이 원문에서 값보다 뒤에 오는가 → true면 수치를 조각 앞에 놓아야 한다
function numComesFirst(frag, text) {
  if (!text) return false;
  const m = text.match(RANGE_IN_TEXT);
  if (!m) return false; // 값 범위가 없는 옵션(경로석 상단 6종)은 이름표가 앞이다
  // 실제 게임 표시처럼 범위를 값 하나로 바꿔 놓고 위치를 잰다
  const shown = text.slice(0, m.index) + m[1] + text.slice(m.index + m[0].length);
  let fm;
  try {
    fm = new RegExp(frag).exec(shown);
  } catch {
    return false;
  }
  return fm ? fm.index > m.index : false;
}

// 숫자 뒤에 올 수 있는 것: 단위(%,개,마리…) 또는 범위 표시의 "("
//
// 단위가 없는 경우 — 라틴 문자 언어는 값 뒤에 단어가 온다("10 uses remaining") —
// 앵커가 없으면 "10"이 "100" 안에서 잡히는 오탐이 난다. 그래서 단어 경계(\b)를 쓴다.
// (CJK는 단위 글자가 있으므로 그걸 쓴다. \b는 유니코드 처리 방식에 따라 CJK에서 경계가
//  생기지 않을 수 있어 믿지 않는다.)
function valueAnchor(unit) {
  if (!unit) return "\\b";
  return "[" + unit + "(]";
}

// 조각 + 최소값 → 검색 piece.
// opts: {openMax, rmin, rmax, noPercent} — 옵션별 수치 처리 방식.
export function piece(frag, minInput, text, opts) {
  opts = opts || {};
  const mn = String(minInput == null ? "" : minInput).trim();
  if (mn === "") return frag;
  const v = parseInt(mn, 10);
  if (isNaN(v)) return frag;

  const join = (num) => (numComesFirst(frag, text) ? num + ".*" + frag : frag + ".*" + num);

  // 명시적 범위(rmin~rmax): 부활 횟수 0~6 — 이산 카운트라 '정확히 N' 매칭.
  // 아이템에 "부활 횟수: 3"으로 뜨고 범위 표시가 없다 → 앵커 없이 숫자만.
  if (opts.rmin != null && opts.rmax != null) {
    const val = Math.min(Math.max(v, opts.rmin), opts.rmax);
    const rg = rangeRegex(val, val);
    return rg ? join(rg + (opts.noPercent ? "" : "%")) : frag;
  }

  // 상한 없는 옵션(경로석 상단 6종): 합산 값이라 범위 표시가 없다 → 단위만 붙인다.
  if (opts.openMax) {
    const rg = rangeRegex(v, 999);
    return rg ? join(rg + (opts.noPercent ? "" : "%")) : frag;
  }

  // 접사 — 원문 범위 안에서 "N 이상". 값 뒤에 범위 표시가 붙을 수 있다.
  const rr = text ? rangeMinMax(text) : null;
  if (rr) {
    const lo = Math.min(v, rr.max);
    const rg = rangeRegex(lo, rr.max);
    return rg ? join(rg + valueAnchor(rr.unit)) : frag;
  }

  const rg = rangeRegex(v, 999);
  return rg ? join(rg + "[%(]") : frag;
}
