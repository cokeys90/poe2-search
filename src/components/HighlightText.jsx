import { highlightRanges } from "../lib/search.js";

// 옵션 원문의 강조 두 가지를 한 번에 그린다.
//
//   수치 범위 (30—40)%  → 파랑(primary). 늘 켜져 있다
//   찾기에 친 낱말        → 노랑. 지금 찾고 있는 것을 눈에 띄게
//
// ⚠️ 두 강조는 겹칠 수 있다 ("에센스 1개"를 찾으면 숫자와 겹친다). 그래서 span을 중첩하지 않고
//    **글자마다 무엇으로 칠할지** 정한 뒤 같은 색끼리 묶어 한 번만 칠한다.
//    겹치면 검색어 강조가 이긴다 — 지금 찾고 있는 게 더 중요하다.

const NUM = /\([0-9]+[—\-–][0-9\-]+\)%?|\+?\([^)]*\)%?|[0-9]+%/g;

// 수치 범위 구간 [start, end)
function numRanges(text) {
  const out = [];
  for (const m of text.matchAll(NUM)) {
    if (/[0-9]/.test(m[0])) out.push([m.index, m.index + m[0].length]);
  }
  return out;
}

export default function HighlightText({ text, query }) {
  const s = String(text ?? "");

  const paint = new Uint8Array(s.length); // 0=없음 1=수치 2=검색어
  for (const [a, b] of numRanges(s)) paint.fill(1, a, b);
  for (const [a, b] of highlightRanges(s, query)) paint.fill(2, a, b);

  const parts = [];
  let i = 0;
  while (i < s.length) {
    const kind = paint[i];
    let j = i;
    while (j < s.length && paint[j] === kind) j++;
    parts.push({ kind, str: s.slice(i, j) });
    i = j;
  }

  return (
    <>
      {parts.map((p, idx) =>
        p.kind === 2 ? (
          <mark
            key={idx}
            className="rounded-sm bg-amber-300 px-px font-semibold text-black dark:bg-amber-400"
          >
            {p.str}
          </mark>
        ) : p.kind === 1 ? (
          <span key={idx} className="font-mono text-[0.92em] text-primary/90">
            {p.str}
          </span>
        ) : (
          <span key={idx}>{p.str}</span>
        )
      )}
    </>
  );
}
