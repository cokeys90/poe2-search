import Modal from "./Modal.jsx";
import { IconClose, IconMail } from "./icons.jsx";

const ISSUES_URL = "https://github.com/cokeys90/poe2-search/issues";

// 문의 다이얼로그. 버그 제보·기능 제안은 GitHub Issues로 안내.
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
      <p className="mb-4 text-body-m text-on-surface-variant">
        버그 제보나 기능 제안을 환영해요. 아래 GitHub Issues에 등록해 주세요.
      </p>
      <a
        href={ISSUES_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex rounded-md-s bg-primary-container px-4 py-2 text-label-l text-on-primary-container transition hover:brightness-110"
      >
        GitHub Issues 열기
      </a>
    </Modal>
  );
}
