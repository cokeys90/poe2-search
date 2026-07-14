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
const RANGE_RE = new RegExp(
  "\\(([0-9]+)[—\\-–]([0-9]+)\\)\\s*([" + TOKENS.units.replace(/[\]\\^-]/g, "\\$&") + "]*)"
);

export function parseRange(text) {
  let m = text.match(RANGE_RE);
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

// 경로석 등급 검색 세트. \bN등급 → "5등급"이 "15등급"에 오매칭되지 않게 단어 경계 사용.
// tier: 숫자 또는 ""/null(무관)  → 반환: "\b15등급" 등, 없으면 ""
export function tierPiece(tier) {
  const t = parseInt(String(tier).trim(), 10);
  if (isNaN(t) || t <= 0) return "";
  return "\\b" + t + TOKENS.tier;
}

// 조각 + 최소값 → 검색 piece.
// opts: {openMax, rmin, rmax, noPercent} — 옵션별 수치 처리 방식.
export function piece(frag, minInput, text, opts) {
  opts = opts || {};
  let t = frag;
  const mn = String(minInput == null ? "" : minInput).trim();
  if (mn === "") return t;
  const v = parseInt(mn, 10);
  if (isNaN(v)) return t;
  const pct = opts.noPercent ? "" : "%";
  // 명시적 범위(rmin~rmax): 부활 횟수 0~6 — 이산 카운트라 '정확히 N' 매칭.
  // (0 이상은 전부라 범위로는 0을 못 고름. 게임 검색은 줄 단위라 그 줄의 N만 매칭됨.)
  if (opts.rmin != null && opts.rmax != null) {
    const val = Math.min(Math.max(v, opts.rmin), opts.rmax);
    const rg = rangeRegex(val, val);
    if (rg) t = t + ".*" + rg + pct;
    return t;
  }
  // 상한 없는 옵션: 입력값 ~ 999 (N 이상)
  if (opts.openMax) {
    const rg = rangeRegex(v, 999);
    if (rg) t = t + ".*" + rg + pct;
    return t;
  }
  // 옵션 원문 범위 (N 이상). 입력값을 넣었으면 최소값 이하여도 반영.
  const rr = text ? rangeMinMax(text) : null;
  if (rr) {
    const lo = Math.min(v, rr.max);
    const rg = rangeRegex(lo, rr.max);
    if (rg) t = t + ".*" + rg + (rr.unit || "");
    return t;
  }
  const rg = rangeRegex(v, 999);
  if (rg) t = t + ".*" + rg + "%";
  return t;
}
