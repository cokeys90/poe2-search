import { useState } from "react";
import Modal from "./Modal.jsx";
import { IconClose, IconTrade, IconCheck, IconSave } from "./icons.jsx";
import { bookmarkletCode } from "../lib/trade.js";

// 거래소 조건을 우리 앱으로 가져오기 — 북마클릿 전용.
// 링크(짧은 검색 ID)로 가져오는 경로는 거래소 API를 거쳐야 하는데, CORS가 없고
// 서버로 우회하면 IP 레이트리밋에 걸려 불안정해서 두지 않는다.
export default function TradeImportDialog({ onClose }) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard?.writeText(bookmarkletCode()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Modal
      onClose={onClose}
      className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-md-l border border-outline-variant bg-surface-c-high shadow-2xl"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-outline-variant px-5 py-4">
        <IconTrade width={20} className="text-primary" />
        <h2 className="text-title-m text-on-surface">거래소에서 가져오기</h2>
        <button
          onClick={onClose}
          className="ml-auto rounded-full p-1 text-on-surface-variant hover:bg-surface-c-highest"
        >
          <IconClose width={20} />
        </button>
      </div>

      <div className="flex flex-col gap-5 overflow-y-auto px-5 py-4">
        <section>
          <h3 className="mb-1 text-title-s text-primary">1단계 · 즐겨찾기 등록 (처음 한 번만)</h3>
          <p className="mb-3 text-body-m text-on-surface-variant">
            아래 버튼을 <b className="text-on-surface">즐겨찾기 바로 끌어다 놓으세요.</b>
            <br />
            드래그가 안 되면 <b className="text-on-surface">코드 복사</b>를 누르고, 즐겨찾기를 새로
            만들어 <b className="text-on-surface">URL 칸에 붙여넣으세요.</b> (주소창이 아니라
            즐겨찾기의 URL 칸이에요)
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={bookmarkletCode()}
              onClick={(e) => e.preventDefault()}
              draggable
              title="즐겨찾기 바로 끌어다 놓으세요"
              className="inline-flex cursor-grab items-center gap-1.5 rounded-md-s bg-secondary-container px-3 py-2 text-label-l text-on-secondary-container active:cursor-grabbing"
            >
              <IconTrade width={17} /> PoE2 조건 가져오기
            </a>
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-1 rounded-md-s border border-outline px-3 py-2 text-label-m text-on-surface-variant transition hover:bg-surface-c-highest hover:text-on-surface"
            >
              {copied ? <IconCheck width={16} /> : <IconSave width={16} />}
              {copied ? "복사됨" : "코드 복사"}
            </button>
            <span className="text-body-s text-on-surface-variant">
              즐겨찾기 바 표시: <b className="text-on-surface">Ctrl+Shift+B</b>
            </span>
          </div>
        </section>

        <section className="border-t border-outline-variant pt-4">
          <h3 className="mb-1 text-title-s text-primary">2단계 · 사용하기</h3>
          <ol className="list-decimal space-y-1 pl-5 text-body-m text-on-surface-variant">
            <li>거래소에서 평소처럼 검색해요.</li>
            <li>
              그 화면에서 즐겨찾기{" "}
              <b className="text-on-surface">「PoE2 조건 가져오기」</b>를 클릭해요.
            </li>
            <li>이 앱이 열리면서 그 조건이 그대로 적용돼요. 끝!</li>
          </ol>
          <p className="mt-3 text-body-s text-on-surface-variant">
            거래소 화면에 이미 있는 값을 읽는 방식이라 거래소 서버에 요청하지 않아요. 그래서 요청
            제한 없이 항상 동작해요.
          </p>
        </section>
      </div>
    </Modal>
  );
}
