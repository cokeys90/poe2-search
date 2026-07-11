import HighlightText from "./HighlightText.jsx";
import { hasNumeric, rangeHint } from "../lib/regex.js";

export default function OptionRow({ item, sel, showTrade, onToggle, onSetMin }) {
  const s = sel;
  const numeric = item.numeric || hasNumeric(item.text);
  const hint =
    item.rmin != null && item.rmax != null
      ? item.rmin + "-" + item.rmax
      : rangeHint(item.text);

  const mode = s?.mode; // "inc" | "exc" | undefined
  const container =
    mode === "inc"
      ? "border-tertiary bg-tertiary-container/20"
      : mode === "exc"
      ? "border-error bg-error-container/20"
      : "border-outline-variant bg-surface-c hover:bg-surface-c-high";

  return (
    <div
      className={`flex items-stretch overflow-hidden rounded-md-m border transition-colors ${container}`}
    >
      <input
        type="number"
        inputMode="numeric"
        placeholder={numeric ? hint || "≥" : "—"}
        disabled={!numeric}
        value={s ? s.min || "" : ""}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onSetMin(item, e.target.value)}
        className={[
          "w-[82px] shrink-0 border-0 border-r border-outline-variant bg-surface-c-lowest px-2 text-center font-mono text-body-l text-primary outline-none transition",
          "placeholder:text-body-s placeholder:text-on-surface-variant/50",
          "focus:bg-surface-c-low focus:shadow-[inset_0_0_0_2px_rgb(var(--md-primary))]",
          "disabled:cursor-not-allowed disabled:text-on-surface-variant/30 disabled:placeholder:text-on-surface-variant/25",
        ].join(" ")}
      />
      <button
        onClick={() => onToggle(item)}
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-left text-body-l text-on-surface"
      >
        <span className="w-5 shrink-0 text-center font-bold">
          {mode === "inc" ? (
            <span className="text-tertiary">✓</span>
          ) : mode === "exc" ? (
            <span className="text-error">✕</span>
          ) : (
            ""
          )}
        </span>
        <span className="flex-1 leading-normal">
          <HighlightText text={item.text} />
        </span>
        {showTrade && item.trade && (
          <span className="hidden shrink-0 whitespace-nowrap rounded-md-xs bg-surface-c-high px-2 py-0.5 font-mono text-label-s text-on-surface-variant md:inline">
            {item.trade}
          </span>
        )}
        <span className="shrink-0 whitespace-nowrap rounded-md-xs bg-surface-c-high px-2 py-0.5 font-mono text-label-m text-primary">
          {item.frag}
        </span>
      </button>
    </div>
  );
}
