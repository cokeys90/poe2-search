// 옵션 원문에서 (30—40)% 같은 수치 범위만 강조 표시.
// split의 캡처 매치는 홀수 인덱스에만 오므로, 사이 텍스트에 섞인 숫자
// ("에센스 1개")나 설명 괄호는 강조하지 않는다.
export default function HighlightText({ text }) {
  const parts = text.split(/(\([0-9]+[—\-–][0-9\-]+\)%?|\+?\([^)]*\)%?|[0-9]+%)/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 && /[0-9]/.test(p) ? (
          <span key={i} className="text-primary/90 font-mono text-[0.92em]">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}
