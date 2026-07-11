import Modal from "./Modal.jsx";
import { IconClose, IconMail } from "./icons.jsx";

// 문의 다이얼로그 placeholder. 실제 문의 채널은 추후 결정 (TODO).
export default function ContactDialog({ onClose }) {
  return (
    <Modal onClose={onClose} className="w-full max-w-sm rounded-md-l bg-surface-c-high p-6 shadow-2xl">
      <div className="mb-4 flex items-center gap-2">
        <IconMail width={22} height={22} className="text-primary" />
        <h2 className="text-title-l text-on-surface">문의하기</h2>
        <button
          onClick={onClose}
          className="ml-auto rounded-full p-1 text-on-surface-variant hover:bg-surface-c-highest"
        >
          <IconClose width={20} height={20} />
        </button>
      </div>
      <p className="text-body-m text-on-surface-variant">
        버그 제보나 기능 제안을 환영해요. 문의 채널은 준비 중입니다.
      </p>
    </Modal>
  );
}
