// 고정(핀) 토글 버튼. 옵션·가격·타락·등급 등에서 공용.
export default function PinButton({ pinned, onClick }) {
  return (
    <button
      onClick={onClick}
      title={pinned ? "고정 해제" : "고정 (다음에도 유지)"}
      className={`px-1 transition ${
        pinned ? "text-primary" : "text-on-surface-variant/50 hover:text-primary"
      }`}
    >
      📌
    </button>
  );
}
