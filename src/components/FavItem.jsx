import { useState, useMemo } from "react";
import { buildPattern } from "../lib/pattern.js";
import { IconEdit, IconTrash, IconSave, IconCheck, IconTrade } from "./icons.jsx";
import { TabletIcon, WaystoneIcon } from "./GameIcon.jsx";
import Tooltip from "./Tooltip.jsx";
import { t } from "../i18n/index.js";

// 즐겨찾기 항목 한 개. variant로 카드형(2줄)·리스트형(1줄) 두 모양을 낸다.
// 두 모양 모두 드래그 앤 드롭(그룹 간 이동·정렬)을 지원한다.
export default function FavItem({
  fav,
  variant = "card", // card | list
  showPattern = true,
  autoEdit,
  dnd,
  onLoad,
  onRename,
  onDelete,
  onOverwrite,
  onTrade,
}) {
  const [editing, setEditing] = useState(autoEdit);
  const [name, setName] = useState(fav.name);
  const [flash, setFlash] = useState(false);
  const list = variant === "list";
  // 저장된 검색어를 쓰지 않고 매번 만든다 — 저장해두면 언어를 바꿔도 옛 언어의 검색어가 남는다
  const pattern = useMemo(() => buildPattern(fav), [fav]);
  // 저장 당시 고른 서판 종류 / 경로석 등급 그림으로 표시
  const icon =
    fav.tab === "waystone" ? (
      <WaystoneIcon tier={fav.tier} width={18} />
    ) : (
      <TabletIcon type={fav.tabletType} width={18} />
    );

  const commit = () => {
    onRename(fav.id, name);
    setEditing(false);
  };
  const overwrite = () => {
    onOverwrite(fav.id);
    setFlash(true);
    setTimeout(() => setFlash(false), 1000);
  };

  // 이름 편집은 카드/줄 모양을 유지한 채 제목 자리에서만 — 아이콘·옵션(패턴)을 보면서 이름 짓는다
  const nameInput = (
    <input
      autoFocus
      value={name}
      onFocus={(e) => e.target.select()} // 기본 이름을 바로 덮어쓸 수 있게
      onChange={(e) => setName(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      onBlur={commit}
      className="min-w-0 flex-1 rounded-md-xs border border-primary bg-surface-c-lowest px-1.5 py-0.5 text-label-l text-on-surface outline-none"
    />
  );

  const over = dnd.overFavId === fav.id && dnd.dragId !== fav.id;
  return (
    <div
      draggable={!editing} // 편집 중엔 텍스트 선택이 우선
      onDragStart={(e) => dnd.onDragStart(e, fav.id)}
      onDragEnd={dnd.onDragEnd}
      onDragOver={(e) => dnd.onCardDragOver(e, fav.id)}
      onDrop={(e) => dnd.onCardDrop(e, fav.id)}
      className={`group relative cursor-grab transition-colors active:cursor-grabbing ${
        list
          ? `rounded-md-xs border-t border-t-transparent hover:bg-surface-c ${
              over ? "!border-t-primary" : ""
            }`
          : `flex flex-wrap items-center rounded-md-s border bg-surface-c pr-1.5 hover:bg-surface-c-high ${
              over ? "border-t-2 border-t-primary" : "border-outline-variant"
            }`
      } ${dnd.dragId === fav.id ? "opacity-40" : ""} ${flash ? "ring-2 ring-primary" : ""}`}
    >
      {/* 액션 — 카드형은 상단 제목줄에 고정 노출, 리스트형은 hover 시 우측에 */}
      <div
        className={
          list
            ? `absolute right-1.5 top-1/2 flex -translate-y-1/2 gap-0.5 transition-opacity ${
                flash ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`
            : "order-1 flex shrink-0 gap-0.5"
        }
      >
        <Tooltip label={t("favs.openTrade")}>
          <button
            onClick={() => onTrade(fav)}
            className="rounded-full p-1 text-on-surface-variant hover:bg-surface-c-highest hover:text-primary"
          >
            <IconTrade width={15} />
          </button>
        </Tooltip>
        <Tooltip label={t("favs.overwrite")}>
          <button
            onClick={overwrite}
            className={`rounded-full p-1 hover:bg-surface-c-highest ${
              flash ? "text-primary" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {flash ? <IconCheck width={15} /> : <IconSave width={15} />}
          </button>
        </Tooltip>
        <Tooltip label={t("favs.rename")}>
          <button
            onClick={() => setEditing(true)}
            className="rounded-full p-1 text-on-surface-variant hover:bg-surface-c-highest hover:text-primary"
          >
            <IconEdit width={15} />
          </button>
        </Tooltip>
        <Tooltip label={t("favs.delete")}>
          <button
            onClick={() => onDelete(fav.id)}
            className="rounded-full p-1 text-on-surface-variant hover:bg-surface-c-highest hover:text-error"
          >
            <IconTrash width={15} />
          </button>
        </Tooltip>
      </div>

      {list ? (
        <div className="flex w-full items-center gap-2 px-1.5 py-1">
          {icon}
          {editing ? (
            nameInput
          ) : (
            <>
              <button
                onClick={() => onLoad(fav)}
                className="min-w-0 flex-1 truncate text-left text-label-l text-on-surface"
              >
                {fav.name}
              </button>
              {showPattern && pattern && (
                <span className="max-w-[45%] shrink truncate font-mono text-label-s text-on-surface-variant group-hover:invisible">
                  {pattern}
                </span>
              )}
              <span className="w-[5.5rem] shrink-0" aria-hidden />
            </>
          )}
        </div>
      ) : (
        <div className="order-0 flex min-w-0 flex-1 items-center gap-2 py-1.5 pl-2">
          {icon}
          {editing ? (
            nameInput
          ) : (
            <button
              onClick={() => onLoad(fav)}
              className="min-w-0 flex-1 truncate text-left text-label-l text-on-surface"
            >
              {fav.name}
            </button>
          )}
        </div>
      )}

      {/* 카드형 2번째 줄: 패턴 */}
      {!list && showPattern && pattern && (
        <button
          onClick={() => onLoad(fav)}
          className="order-2 block w-full truncate px-2 pb-1.5 text-left font-mono text-label-s text-on-surface-variant"
        >
          {pattern}
        </button>
      )}
    </div>
  );
}
