import { useState } from "react";
import OptionRow from "./OptionRow.jsx";
import HighlightText from "./HighlightText.jsx";
import { IconExpand, IconUnhide } from "./icons.jsx";
import { t } from "../i18n/index.js";

// 옵션 그룹 하나 (옵션 / 접두어 / 접미어 …).
// 보이는 목록 아래에 "숨긴 옵션" 접힘 섹션을 둔다 — 숨기면 여기로 들어가고, 해제하면 다시 위로.
export default function OptionGroup({
  groupId,
  title,
  items, // 보이는 옵션 (순서·숨김 적용 후)
  hidden, // 숨긴 옵션
  filter,
  sel,
  showTrade,
  onToggle,
  onSetMin,
  onReorder,
  onHide,
  onUnhide,
}) {
  const [openHidden, setOpenHidden] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  // 옵션 순서 드래그 (즐겨찾기 카드 이동과 같은 방식 — 대상 행 앞에 삽입)
  const clear = () => {
    setDragId(null);
    setOverId(null);
  };
  const dnd = {
    dragId,
    overId,
    onDragStart: (e, id) => {
      setDragId(id);
      e.dataTransfer.effectAllowed = "move";
    },
    onDragEnd: clear,
    onDragOver: (e, id) => {
      if (dragId == null) return;
      e.preventDefault();
      setOverId(id);
    },
    onDrop: (e, id) => {
      e.preventDefault();
      if (dragId && dragId !== id) onReorder(dragId, id);
      clear();
    },
  };

  // 대소문자 무시 - 라틴 문자 언어에서 'fire'로 'Fire'를 찾을 수 있어야 한다
  const needle = filter.trim().toLowerCase();
  const shown = needle ? items.filter((it) => it.text.toLowerCase().includes(needle)) : items;
  if (!shown.length && !hidden.length) return null;

  return (
    <div data-group={groupId} className="mb-8">
      <div className="mb-3.5 flex items-center gap-3 px-0.5">
        <span className="font-cinzel text-label-l uppercase tracking-[2px] text-primary">
          {title}
        </span>
        <span className="rounded-full border border-outline-variant px-2 py-0.5 text-label-s text-on-surface-variant">
          {shown.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {shown.map((it) => {
          const id = it.key;
          return (
            <OptionRow
              key={id}
              id={id}
              item={it}
              sel={sel[id]}
              showTrade={showTrade}
              onToggle={onToggle}
              onSetMin={onSetMin}
              onHide={() => onHide(id)}
              dnd={dnd}
            />
          );
        })}
      </div>

      {/* 숨긴 옵션 */}
      {hidden.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setOpenHidden((o) => !o)}
            className="flex items-center gap-1 rounded-md-s px-1.5 py-1 text-label-m text-on-surface-variant transition hover:bg-surface-c-high hover:text-on-surface"
          >
            <IconExpand
              width={18}
              className={`transition-transform ${openHidden ? "" : "-rotate-90"}`}
            />
            {t("option.hidden", { n: hidden.length })}
          </button>

          {openHidden && (
            <div className="mt-1.5 flex flex-col gap-1 rounded-md-m border border-dashed border-outline-variant p-2">
              {hidden.map((it) => (
                <div
                  key={it.key}
                  className="flex items-center gap-2 rounded-md-s px-2 py-1.5 text-body-m text-on-surface-variant"
                >
                  <button
                    onClick={() => onUnhide(it.key)}
                    title={t("option.unhide")}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-on-surface-variant/60 transition hover:bg-tertiary-container/40 hover:text-tertiary"
                  >
                    <IconUnhide width={19} />
                  </button>
                  <span className="min-w-0 flex-1 truncate">
                    <HighlightText text={it.text} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
