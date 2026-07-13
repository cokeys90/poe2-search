// 힌트 툴팁. 브라우저 기본 title은 커서 아래에 떠서 포인터에 가려지므로,
// 대상 버튼 "바로 위"에 고정 위치로 띄운다. 마우스를 따라가지 않아 위치가 예측 가능하다.
export default function Tooltip({ label, children, className = "" }) {
  return (
    <span className={`group/tip relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md-xs border border-outline-variant bg-surface-c-highest px-2 py-1 text-label-s text-on-surface opacity-0 shadow-lg transition-[opacity,transform] duration-100 group-hover/tip:translate-y-0 group-hover/tip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
