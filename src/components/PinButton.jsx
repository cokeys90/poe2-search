import { t } from "../i18n/index.js";
// 고정(핀) 토글 버튼. 옵션·가격·타락·등급 등에서 공용.
export default function PinButton({ pinned, onClick }) {
  return (
    <button
      onClick={onClick}
      title={pinned ? t("pin.off") : t("pin.on")}
      className={`px-1 transition ${
        pinned ? "text-primary" : "text-on-surface-variant/50 hover:text-primary"
      }`}
    >
      📌
    </button>
  );
}
