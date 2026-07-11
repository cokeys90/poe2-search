// 다이얼로그 공통 셸: 스크림 + 중앙 정렬 + backdrop 클릭 닫기.
// className으로 내부 카드 스타일을 지정한다.
export default function Modal({ onClose, className = "", children }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div onClick={(e) => e.stopPropagation()} className={className}>
        {children}
      </div>
    </div>
  );
}
