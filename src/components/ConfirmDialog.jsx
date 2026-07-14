import Modal from "./Modal.jsx";
import { t } from "../i18n/index.js";

// 범용 확인 다이얼로그.
export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal onClose={onCancel} className="w-full max-w-sm rounded-md-l bg-surface-c-high p-6 shadow-2xl">
      <h2 className="mb-2 text-title-m text-on-surface">{title}</h2>
      <p className="mb-5 text-body-m text-on-surface-variant">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-md-s px-4 py-2 text-label-l text-on-surface-variant transition hover:bg-surface-c-highest"
        >
          {cancelLabel ?? t("common.cancel")}
        </button>
        <button
          onClick={onConfirm}
          className="rounded-md-s bg-primary-container px-4 py-2 text-label-l text-on-primary-container transition hover:brightness-110"
        >
          {confirmLabel ?? t("common.confirm")}
        </button>
      </div>
    </Modal>
  );
}
