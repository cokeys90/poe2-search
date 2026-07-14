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
          "w-[62px] shrink-0 rounded-l-md-m border-0 border-r border-outline-variant bg-surface-c-lowest px-1 text-center font-mono text-body-m text-primary outline-none transition",
          "placeholder:text-body-s placeholder:text-on-surface-variant/50",
          "focus:bg-surface-c-low focus:shadow-[inset_0_0_0_2px_rgb(var(--md-primary))]",
          "disabled:cursor-not-allowed disabled:text-on-surface-variant/30 disabled:placeholder:text-on-surface-variant/25",
        ].join(" ")}
      />
      <button
        onClick={() => onToggle(item)}
        className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left text-body-m text-on-surface"
      >
        <span className="w-4 shrink-0 text-center font-bold">
          {mode === "inc" ? (
            <span className="text-tertiary">✓</span>
          ) : mode === "exc" ? (
            <span className="text-error">✕</span>
          ) : (
            ""
          )}
        </span>
        <span className="min-w-0 flex-1 leading-snug">
          <HighlightText text={item.text} />
          {/* 복합 모드의 부가 옵션 — 이 옵션이 붙으면 딸려오는 효과. 검색 대상은 아니라 다운톤으로. */}
          {item.extra?.map((line, i) => (
            <span key={i} className="mt-0.5 block text-body-s text-on-surface-variant/70">
              + <HighlightText text={line} />
            </span>
          ))}
          {/* 거래소명은 개발 빌드에서만 (showTrade가 dev 전용 토글). 옵션 원문 아래 줄에 표시 */}
          {showTrade && item.trade && (
            <span className="mt-1 block truncate font-mono text-label-s text-on-surface-variant">
              {item.trade}
            </span>
          )}
        </span>
      </button>

      {/* 순서 드래그 핸들 · 숨기기 */}
      <div className="flex shrink-0 items-center gap-0.5 border-l border-outline-variant pl-0.5 pr-1">
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
