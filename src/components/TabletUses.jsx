import HighlightText from "./HighlightText.jsx";
import { t } from "../i18n/index.js";

// 서판 고정 옵션 — 종류마다 늘 붙어 있는 "지도에 … 추가 / 잔여 사용 횟수 N회".
// 안 쓴 서판(10회)만 찾는 게 거래의 기본이라 기본으로 켜져 있고, 끌 수도 있다.
// 옵션 목록이 아니라 서판 종류 바로 아래에 둔다 — 종류를 고르면 따라 바뀌는 값이기 때문.
export default function TabletUses({ item, value, onChange }) {
  if (!item) return null;
  const on = value.on;

  return (
    <div
      className={`mb-4 flex items-stretch rounded-md-m border transition-colors ${
        on ? "border-tertiary bg-tertiary-container/20" : "border-outline-variant bg-surface-c"
      }`}
    >
      <input
        type="number"
        inputMode="numeric"
        placeholder="1-10"
        disabled={!on}
        value={value.min}
        onChange={(e) => onChange({ ...value, min: e.target.value })}
        className={[
          "w-[62px] shrink-0 rounded-l-md-m border-0 border-r border-outline-variant bg-surface-c-lowest px-1 text-center font-mono text-body-m text-primary outline-none transition",
          "placeholder:text-body-s placeholder:text-on-surface-variant/50",
          "focus:bg-surface-c-low focus:shadow-[inset_0_0_0_2px_rgb(var(--md-primary))]",
          "disabled:cursor-not-allowed disabled:text-on-surface-variant/30",
        ].join(" ")}
      />
      <button
        onClick={() => onChange({ ...value, on: !on })}
        className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left text-body-m text-on-surface"
      >
        <span className="w-4 shrink-0 text-center font-bold">
          {on ? <span className="text-tertiary">✓</span> : ""}
        </span>
        <span className="min-w-0 flex-1 leading-snug">
          <HighlightText text={item.text} />
        </span>
        <span className="shrink-0 rounded-md-xs border border-outline-variant px-1.5 py-0.5 text-label-s text-on-surface-variant">
          {t("option.fixed")}
        </span>
      </button>
    </div>
  );
}
