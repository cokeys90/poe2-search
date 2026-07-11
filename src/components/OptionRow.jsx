import HighlightText from "./HighlightText.jsx";
import { hasNumeric, rangeHint } from "../lib/regex.js";

export default function OptionRow({ item, sel, showTrade, onToggle, onSetMin, delay }) {
  const s = sel;
  const numeric = item.numeric || hasNumeric(item.text);
  const hint =
    item.rmin != null && item.rmax != null
      ? item.rmin + "-" + item.rmax
      : rangeHint(item.text);

  const mode = s?.mode; // "inc" | "exc" | undefined
  const borderCls =
    mode === "inc"
      ? "border-rune shadow-[0_0_0_1px_rgba(74,155,142,.3),0_0_20px_rgba(74,155,142,.12)]"
      : mode === "exc"
      ? "border-copper shadow-[0_0_0_1px_rgba(176,74,58,.3)]"
      : "border-edge hover:border-[#5f4a28] hover:shadow-[0_4px_16px_rgba(0,0,0,.4)]";

  const bodyBg =
    mode === "inc"
      ? "bg-gradient-to-b from-rune-bg to-[#0e1f1c]"
      : mode === "exc"
      ? "bg-gradient-to-b from-copper-bg to-[#1f0f0c]"
      : "";

  return (
    <div
      className={`flex items-stretch overflow-hidden rounded-[10px] border bg-gradient-to-b from-panel to-[#120d07] animate-optin ${borderCls}`}
      style={{ animationDelay: delay + "ms" }}
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
          "w-[82px] shrink-0 border-0 border-r border-edge bg-[#0b0805] px-2 text-center font-mono text-[15px] text-gold-hi outline-none transition placeholder:text-[11px] placeholder:text-[#5a4e3a]",
          "focus:bg-[#100b06] focus:shadow-[inset_0_0_0_1px_theme(colors.gold)]",
          "disabled:cursor-not-allowed disabled:bg-[#0e0b08] disabled:text-[#3a3227] disabled:placeholder:text-[#332b20]",
          mode === "inc" ? "bg-[#0c1614]" : "",
        ].join(" ")}
      />
      <button
        onClick={() => onToggle(item)}
        className={`flex min-w-0 flex-1 items-center gap-3 border-0 px-[18px] py-4 text-left text-[15px] text-ink ${bodyBg}`}
      >
        <span className="w-[22px] shrink-0 text-center font-bold">
          {mode === "inc" ? (
            <span className="text-rune">✓</span>
          ) : mode === "exc" ? (
            <span className="text-copper">✕</span>
          ) : (
            ""
          )}
        </span>
        <span className="flex-1 leading-normal">
          <HighlightText text={item.text} />
        </span>
        {showTrade && item.trade && (
          <span className="hidden shrink-0 whitespace-nowrap rounded border border-edge bg-bg1 px-2 py-0.5 font-mono text-[11px] text-mute md:inline">
            {item.trade}
          </span>
        )}
        <span className="shrink-0 whitespace-nowrap rounded-[5px] border border-edge bg-bg1 px-[7px] py-0.5 font-mono text-[12.5px] text-gold/75">
          {item.frag}
        </span>
      </button>
    </div>
  );
}
