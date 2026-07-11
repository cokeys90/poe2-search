// 옵션 원문에서 (30—40)% 같은 수치 범위를 강조 표시
export default function HighlightText({ text }) {
  const parts = text.split(/(\([0-9]+[—\-–][0-9\-]+\)%?|\+?\([^)]*\)%?|[0-9]+%)/g);
  return (
    <>
      {parts.map((p, i) =>
        /[0-9]/.test(p) ? (
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
