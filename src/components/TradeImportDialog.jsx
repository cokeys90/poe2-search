import { useState } from "react";
import Modal from "./Modal.jsx";
import { IconClose, IconTrade, IconCheck, IconSave } from "./icons.jsx";
import { bookmarkletCode } from "../lib/trade.js";
import { useT } from "../i18n/index.js";

// 거래소 조건을 우리 앱으로 가져오기 — 북마클릿 전용.
// 링크(짧은 검색 ID)로 가져오는 경로는 거래소 API를 거쳐야 하는데, CORS가 없고
// 서버로 우회하면 IP 레이트리밋에 걸려 불안정해서 두지 않는다.
export default function TradeImportDialog({ onClose }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const name = t("import.bookmarklet");

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
        <h2 className="text-title-m text-on-surface">{t("import.title")}</h2>
        <button
          onClick={onClose}
          className="ml-auto rounded-full p-1 text-on-surface-variant hover:bg-surface-c-highest"
        >
          <IconClose width={20} />
        </button>
      </div>

      <div className="flex flex-col gap-5 overflow-y-auto px-5 py-4">
        <section>
          <h3 className="mb-1 text-title-s text-primary">{t("import.step1")}</h3>
          <p className="mb-3 text-body-m text-on-surface-variant">
            <b className="text-on-surface">{t("import.drag")}</b>
            <br />
            {t("import.dragAlt")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={bookmarkletCode()}
              onClick={(e) => e.preventDefault()}
              draggable
              title={t("import.dragTip")}
              className="inline-flex cursor-grab items-center gap-1.5 rounded-md-s bg-secondary-container px-3 py-2 text-label-l text-on-secondary-container active:cursor-grabbing"
            >
              <IconTrade width={17} /> {name}
            </a>
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-1 rounded-md-s border border-outline px-3 py-2 text-label-m text-on-surface-variant transition hover:bg-surface-c-highest hover:text-on-surface"
            >
              {copied ? <IconCheck width={16} /> : <IconSave width={16} />}
              {copied ? t("import.copied") : t("import.copy")}
            </button>
            <span className="text-body-s text-on-surface-variant">{t("import.barTip")}</span>
          </div>
        </section>

        <section className="border-t border-outline-variant pt-4">
          <h3 className="mb-1 text-title-s text-primary">{t("import.step2")}</h3>
          <ol className="list-decimal space-y-1 pl-5 text-body-m text-on-surface-variant">
            <li>{t("import.s2a")}</li>
            <li>{t("import.s2b", { name })}</li>
            <li>{t("import.s2c")}</li>
          </ol>
          <p className="mt-3 text-body-s text-on-surface-variant">{t("import.note")}</p>
        </section>
      </div>
    </Modal>
  );
}
