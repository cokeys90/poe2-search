import { useState } from "react";
import FloatingWindow from "./FloatingWindow.jsx";
import FavItem from "./FavItem.jsx";
import Tooltip from "./Tooltip.jsx";
import {
  IconStar,
  IconEdit,
  IconTrash,
  IconAdd,
  IconExpand,
  IconClose,
  IconViewList,
  IconViewCard,
} from "./icons.jsx";

/* ── 그룹(폴더) 섹션 ── */
function GroupSection({
  group,
  view,
  showPattern,
  autoEditGroup,
  autoEditFavId,
  dnd,
  onAddToGroup,
  onLoad,
  onRenameFav,
  onDeleteFav,
  onOverwriteFav,
  onTradeFav,
  onRenameGroup,
  onDeleteGroup,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(autoEditGroup);
  const [name, setName] = useState(group.name);

  const commit = () => {
    onRenameGroup(group.id, name);
    setEditing(false);
  };
  const overGroup = dnd.overGroupId === group.id;

  return (
    <section
      onDragOver={(e) => dnd.onGroupDragOver(e, group.id)}
      onDrop={(e) => dnd.onGroupDrop(e, group.id)}
      className={`overflow-hidden rounded-md-s ${overGroup ? "ring-1 ring-primary/40" : ""}`}
    >
      {/* 헤더 — 진한 배경으로 그룹 경계를 보이게 */}
      <div className="group flex items-center gap-1 bg-secondary-container px-1 py-1">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="rounded-full p-0.5 text-on-secondary-container"
        >
          <IconExpand width={18} className={`transition-transform ${collapsed ? "-rotate-90" : ""}`} />
        </button>
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            onBlur={commit}
            className="min-w-0 flex-1 rounded-md-xs border border-outline bg-surface-c-lowest px-2 py-0.5 text-label-l text-on-surface outline-none focus:border-primary"
          />
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate text-label-l text-on-secondary-container">
              {group.name}
            </span>
            <span className="text-label-s text-on-secondary-container/70">{group.items.length}</span>
            <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Tooltip label="그룹 이름 변경">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-full p-1 text-on-secondary-container/80 hover:bg-black/10 hover:text-on-secondary-container"
                >
                  <IconEdit width={15} />
                </button>
              </Tooltip>
              <Tooltip label="그룹 삭제">
                <button
                  onClick={() => onDeleteGroup(group)}
                  className="rounded-full p-1 text-on-secondary-container/80 hover:bg-black/10 hover:text-error"
                >
                  <IconTrash width={15} />
                </button>
              </Tooltip>
            </div>
          </>
        )}
      </div>

      {/* 항목 + 추가 버튼 */}
      {!collapsed && (
        <div className={`flex flex-col px-0.5 pb-1.5 pt-1 ${view === "list" ? "gap-0" : "gap-1"}`}>
          {group.items.map((fav) => (
            <FavItem
              key={fav.id}
              fav={fav}
              variant={view}
              showPattern={showPattern}
              autoEdit={fav.id === autoEditFavId}
              dnd={dnd}
              onLoad={onLoad}
              onRename={onRenameFav}
              onDelete={onDeleteFav}
              onOverwrite={onOverwriteFav}
              onTrade={onTradeFav}
            />
          ))}
          <button
            onClick={() => onAddToGroup(group.id)}
            className={`flex items-center justify-center gap-1 rounded-md-s border border-dashed border-outline-variant text-label-m text-on-surface-variant transition hover:border-primary/50 hover:text-primary ${
              view === "list" ? "mt-1 py-1" : "py-1.5"
            }`}
          >
            <IconAdd width={16} /> 여기에 현재 검색 추가
          </button>
        </div>
      )}
    </section>
  );
}

/* ── 즐겨찾기 플로팅 창 ── */
export default function FavoritesWindow({
  geom,
  onGeom,
  fullscreen,
  view,
  onView,
  onClose,
  groups = [],
  autoEditFavId,
  autoEditGroupId,
  onAddToGroup,
  onLoad,
  onRenameFav,
  onDeleteFav,
  onOverwriteFav,
  onTradeFav,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  onMoveFav,
}) {
  const [dragId, setDragId] = useState(null);
  const [overFavId, setOverFavId] = useState(null);
  const [overGroupId, setOverGroupId] = useState(null);

  const clear = () => {
    setDragId(null);
    setOverFavId(null);
    setOverGroupId(null);
  };
  const dnd = {
    dragId,
    overFavId,
    overGroupId,
    onDragStart: (e, id) => {
      setDragId(id);
      e.dataTransfer.effectAllowed = "move";
    },
    onDragEnd: clear,
    onCardDragOver: (e, id) => {
      if (dragId == null) return;
      e.preventDefault();
      e.stopPropagation(); // 그룹 하이라이트와 분리
      setOverFavId(id);
      setOverGroupId(null);
    },
    onCardDrop: (e, id) => {
      e.preventDefault();
      e.stopPropagation();
      if (dragId && dragId !== id) onMoveFav(dragId, null, id); // 대상 카드 앞에 삽입
      clear();
    },
    onGroupDragOver: (e, gid) => {
      if (dragId == null) return;
      e.preventDefault();
      setOverGroupId(gid);
    },
    onGroupDrop: (e, gid) => {
      e.preventDefault();
      if (dragId) onMoveFav(dragId, gid, null); // 그룹 끝에 추가
      clear();
    },
  };

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  // 리스트형에서 창이 좁으면 패턴은 자리를 못 얻으므로 숨긴다
  const showPattern = view === "card" || fullscreen || geom.w >= 300;

  const header = (
    <div className="flex items-center gap-1 border-b border-outline-variant bg-surface-c-low px-3 py-2.5">
      <IconStar width={20} className="shrink-0 text-primary" />
      <span className="mr-auto truncate text-title-s text-on-surface">즐겨찾기</span>
      <div className="flex rounded-md-s border border-outline p-0.5">
        {[
          { v: "list", Icon: IconViewList, title: "리스트형" },
          { v: "card", Icon: IconViewCard, title: "카드형" },
        ].map(({ v, Icon, title }) => (
          <Tooltip key={v} label={title}>
            <button
              onClick={() => onView(v)}
              className={`rounded-md-xs px-1.5 py-0.5 transition ${
                view === v
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-on-surface-variant hover:bg-surface-c-high"
              }`}
            >
              <Icon width={18} />
            </button>
          </Tooltip>
        ))}
      </div>
      <Tooltip label="새 그룹">
        <button
          onClick={onCreateGroup}
          className="rounded-full p-1 text-on-surface-variant transition hover:bg-surface-c-high hover:text-primary"
        >
          <IconAdd width={20} />
        </button>
      </Tooltip>
      <Tooltip label="닫기 (Esc)">
        <button
          onClick={onClose}
          className="rounded-full p-1 text-on-surface-variant transition hover:bg-surface-c-high hover:text-on-surface"
        >
          <IconClose width={20} />
        </button>
      </Tooltip>
    </div>
  );

  return (
    <FloatingWindow
      geom={geom}
      onCommit={onGeom}
      fullscreen={fullscreen}
      onClose={onClose}
      header={header}
    >
      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <IconStar width={40} className="text-outline" />
          <p className="text-body-s text-on-surface-variant">
            <b className="text-on-surface">＋</b> 로 그룹을 만들고
            <br />
            검색 조합을 저장하세요
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 p-1.5">
          {groups.map((g) => (
            <GroupSection
              key={g.id}
              group={g}
              view={view}
              showPattern={showPattern}
              autoEditGroup={g.id === autoEditGroupId}
              autoEditFavId={autoEditFavId}
              dnd={dnd}
              onAddToGroup={onAddToGroup}
              onLoad={onLoad}
              onRenameFav={onRenameFav}
              onDeleteFav={onDeleteFav}
              onOverwriteFav={onOverwriteFav}
              onTradeFav={onTradeFav}
              onRenameGroup={onRenameGroup}
              onDeleteGroup={onDeleteGroup}
            />
          ))}
          {total === 0 && (
            <p className="px-4 py-3 text-center text-body-s text-on-surface-variant">
              그룹의 <b className="text-on-surface">+ 추가</b>로 현재 검색을 저장하세요
            </p>
          )}
        </div>
      )}
    </FloatingWindow>
  );
}
