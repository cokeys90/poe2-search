// 옵션 찾기 — 띄어쓴 단어를 **전부 포함**하면 매칭한다 (순서 무관).
//
//   "에센스 추가"  →  "지도에 에센스 1개 추가 등장"   ✅ (사이에 "1개"가 끼어 있어도 잡힌다)
//   "추가 에센스"  →  같은 옵션                        ✅ (순서는 상관없다)
//   "에센스추가"   →  안 잡힌다                        (붙여 쓰면 한 낱말로 본다)
//
// 흔히 토큰 AND 검색(term-based AND)이라 부른다. 오타 허용(진짜 fuzzy)은 넣지 않는다 —
// 게임 용어는 정확히 써야 하고, 오타를 봐주면 엉뚱한 옵션이 섞여 오히려 헷갈린다.
//
// ⚠️ 검색어 생성과는 무관하다. 이건 화면에서 옵션을 찾는 용도일 뿐이다.

const tokens = (query) =>
  String(query || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

// 이 옵션이 검색어에 걸리는가
export function matches(text, query) {
  const ts = tokens(query);
  if (!ts.length) return true;
  const hay = String(text || "").toLowerCase();
  return ts.every((t) => hay.includes(t));
}

// 강조할 구간 [start, end) 목록. 겹치거나 붙은 구간은 하나로 합친다.
// (같은 낱말이 여러 번 나오면 전부 강조한다 — 눈으로 찾는 게 목적이니까)
export function highlightRanges(text, query) {
  const ts = tokens(query);
  if (!ts.length) return [];
  const hay = String(text || "").toLowerCase();

  const hits = [];
  for (const t of ts) {
    let i = hay.indexOf(t);
    while (i !== -1) {
      hits.push([i, i + t.length]);
      i = hay.indexOf(t, i + 1); // 겹치는 등장도 다 찾는다
    }
  }
  if (!hits.length) return [];

  hits.sort((a, b) => a[0] - b[0]);
  const out = [hits[0]];
  for (const [s, e] of hits.slice(1)) {
    const last = out[out.length - 1];
    if (s <= last[1]) last[1] = Math.max(last[1], e); // 겹치면 합친다
    else out.push([s, e]);
  }
  return out;
}
