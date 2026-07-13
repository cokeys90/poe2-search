import { useState } from "react";
import HighlightText from "./HighlightText.jsx";
import Tooltip from "./Tooltip.jsx";
import { hasNumeric, rangeHint } from "../lib/regex.js";
import { IconReorder, IconHide } from "./icons.jsx";

export default function OptionRow({ item, sel, showTrade, onToggle, onSetMin, onHide, dnd, id }) {
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

  // 드래그 재정렬: 핸들을 누르고 있는 동안에만 행이 draggable이 된다
  // (행 전체가 항상 draggable이면 텍스트 선택·수치 입력이 방해받는다)
  // 행에 overflow-hidden을 걸지 않는다 — 툴팁이 행 밖(위)으로 넘쳐야 하므로 모서리는 자식이 둥글린다.
  const [handleHeld, setHandleHeld] = useState(false);
  const over = dnd.overId === id && dnd.dragId !== id;

  return (
    <div
      draggable={handleHeld}
      onDragStart={(e) => dnd.onDragStart(e, id)}
      onDragEnd={() => {
        setHandleHeld(false);
        dnd.onDragEnd();
      }}
      onDragOver={(e) => dnd.onDragOver(e, id)}
      onDrop={(e) => dnd.onDrop(e, id)}
      className={`flex items-stretch rounded-md-m border transition-colors ${container} ${
        over ? "border-t-2 border-t-primary" : ""
      } ${dnd.dragId === id ? "opacity-40" : ""}`}
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
          "w-[82px] shrink-0 rounded-l-md-m border-0 border-r border-outline-variant bg-surface-c-lowest px-2 text-center font-mono text-body-l text-primary outline-none transition",
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

      {/* 순서 드래그 핸들 · 숨기기 */}
      <div className="flex shrink-0 items-center gap-0.5 border-l border-outline-variant pl-1 pr-1.5">
        <Tooltip label="끌어서 순서 변경">
          <span
            onPointerDown={() => setHandleHeld(true)}
            onPointerUp={() => setHandleHeld(false)}
            className="flex h-7 w-7 cursor-grab items-center justify-center rounded-full text-on-surface-variant/60 transition hover:bg-surface-c-highest hover:text-primary active:cursor-grabbing"
          >
            <IconReorder width={20} />
          </span>
        </Tooltip>
        <Tooltip label="숨기기">
          <button
            onClick={onHide}
            className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant/50 transition hover:bg-error-container/30 hover:text-error"
          >
            <IconHide width={19} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
