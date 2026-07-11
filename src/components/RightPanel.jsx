import { useState } from "react";
import {
  IconStar,
  IconTablet,
  IconWaystone,
  IconEdit,
  IconTrash,
  IconAdd,
  IconExpand,
  IconSave,
  IconCheck,
} from "./icons.jsx";

/* ── 즐겨찾기 카드 (컴팩트, 드래그 가능) ── */
function FavCard({ fav, autoEdit, dnd, onLoad, onRename, onDelete, onOverwrite }) {
  const [editing, setEditing] = useState(autoEdit);
  const [name, setName] = useState(fav.name);
  const [flash, setFlash] = useState(false);
  const TabIcon = fav.tab === "waystone" ? IconWaystone : IconTablet;

  const commit = () => {
    onRename(fav.id, name);
    setEditing(false);
  };
  const overwrite = () => {
    onOverwrite(fav.id);
    setFlash(true);
    setTimeout(() => setFlash(false), 1000);
  };

  if (editing) {
    return (
      <div className="rounded-md-s border border-primary/50 bg-surface-c p-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          onBlur={commit}
          className="w-full rounded-md-xs border border-outline bg-surface-c-lowest px-2 py-1 text-body-m text-on-surface outline-none focus:border-primary"
        />
      </div>
    );
  }

  const over = dnd.overFavId === fav.id && dnd.dragId !== fav.id;
  return (
    <div
      draggable
      onDragStart={(e) => dnd.onDragStart(e, fav.id)}
      onDragEnd={dnd.onDragEnd}
      onDragOver={(e) => dnd.onCardDragOver(e, fav.id)}
      onDrop={(e) => dnd.onCardDrop(e, fav.id)}
      className={`group relative cursor-grab rounded-md-s border bg-surface-c transition-colors hover:bg-surface-c-high active:cursor-grabbing ${
        over ? "border-t-2 border-t-primary" : "border-outline-variant"
      } ${dnd.dragId === fav.id ? "opacity-40" : ""} ${flash ? "ring-2 ring-primary" : ""}`}
    >
      <button onClick={() => onLoad(fav)} className="flex w-full items-center gap-2 px-2.5 py-2 text-left">
        <TabIcon width={14} className="shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block truncate pr-[4.25rem] text-label-l text-on-surface">{fav.name}</span>
          {fav.pattern && (
            <span className="block truncate font-mono text-label-s text-primary/70">{fav.pattern}</span>
          )}
        </span>
      </button>
      <div
        className={`absolute right-1.5 top-1.5 flex gap-0.5 transition-opacity ${
          flash ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <button
          onClick={overwrite}
          title="현재 검색으로 덮어쓰기"
          className={`rounded-full p-1 hover:bg-surface-c-highest ${
            flash ? "text-primary" : "text-on-surface-variant hover:text-primary"
          }`}
        >
          {flash ? <IconCheck width={15} /> : <IconSave width={15} />}
        </button>
        <button
          onClick={() => setEditing(true)}
          title="이름 변경"
          className="rounded-full p-1 text-on-surface-variant hover:bg-surface-c-highest hover:text-primary"
        >
          <IconEdit width={15} />
        </button>
        <button
          onClick={() => onDelete(fav.id)}
          title="삭제"
          className="rounded-full p-1 text-on-surface-variant hover:bg-surface-c-highest hover:text-error"
        >
          <IconTrash width={15} />
        </button>
      </div>
    </div>
  );
}

/* ── 그룹(폴더) 섹션 ── */
function GroupSection({
  group,
  autoEditGroup,
  autoEditFavId,
  dnd,
  onAddToGroup,
  onLoad,
  onRenameFav,
  onDeleteFav,
  onOverwriteFav,
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
      className={`rounded-md-m ${overGroup ? "bg-primary/5 ring-1 ring-primary/40" : ""}`}
    >
      {/* 헤더 */}
      <div className="group flex items-center gap-1 px-1 py-1.5">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="rounded-full p-0.5 text-on-surface-variant hover:text-on-surface"
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
            <span className="min-w-0 flex-1 truncate text-label-l text-on-surface">{group.name}</span>
            <span className="text-label-s text-on-surface-variant">{group.items.length}</span>
            <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => setEditing(true)}
                title="그룹 이름 변경"
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-c-high hover:text-primary"
              >
                <IconEdit width={15} />
              </button>
              <button
                onClick={() => onDeleteGroup(group)}
                title="그룹 삭제"
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-c-high hover:text-error"
              >
                <IconTrash width={15} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* 항목 + 추가 버튼 */}
      {!collapsed && (
        <div className="flex flex-col gap-1.5 pb-2 pl-5 pr-1">
          {group.items.map((fav) => (
            <FavCard
              key={fav.id}
              fav={fav}
              autoEdit={fav.id === autoEditFavId}
              dnd={dnd}
              onLoad={onLoad}
              onRename={onRenameFav}
              onDelete={onDeleteFav}
              onOverwrite={onOverwriteFav}
            />
          ))}
          <button
            onClick={() => onAddToGroup(group.id)}
            className="flex items-center justify-center gap-1 rounded-md-s border border-dashed border-outline-variant py-1.5 text-label-m text-on-surface-variant transition hover:border-primary/50 hover:text-primary"
          >
            <IconAdd width={16} /> 여기에 현재 검색 추가
          </button>
        </div>
      )}
    </section>
  );
}

/* ── 우측 즐겨찾기 패널 ── */
export default function RightPanel({
  groups = [],
  autoEditFavId,
  autoEditGroupId,
  onAddToGroup,
  onLoad,
  onRenameFav,
  onDeleteFav,
  onOverwriteFav,
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
      if (dragId && dragId !== id) onMoveFav(dragId, null, id); // 대상 카드 앞에 삽입 (그룹은 App이 대상카드로 판단)
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

  return (
    <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-l border-outline-variant bg-surface-c-low xl:flex">
      <div className="flex items-center gap-2 border-b border-outline-variant px-4 py-4">
        <IconStar width={20} className="text-primary" />
        <span className="text-title-s text-on-surface">즐겨찾기</span>
        <button
          onClick={onCreateGroup}
          className="ml-auto flex items-center gap-1 rounded-md-s bg-secondary-container px-2.5 py-1 text-label-m text-on-secondary-container transition hover:brightness-110"
        >
          <IconAdd width={16} /> 새 그룹
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <IconStar width={40} className="text-outline" />
          <p className="text-body-s text-on-surface-variant">
            <b className="text-on-surface">새 그룹</b>을 만들고
            <br />
            검색 조합을 저장하세요
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1 p-2">
          {groups.map((g) => (
            <GroupSection
              key={g.id}
              group={g}
              autoEditGroup={g.id === autoEditGroupId}
              autoEditFavId={autoEditFavId}
              dnd={dnd}
              onAddToGroup={onAddToGroup}
              onLoad={onLoad}
              onRenameFav={onRenameFav}
              onDeleteFav={onDeleteFav}
              onOverwriteFav={onOverwriteFav}
              onRenameGroup={onRenameGroup}
              onDeleteGroup={onDeleteGroup}
            />
          ))}
        </div>
      )}

      {total === 0 && groups.length > 0 && (
        <p className="px-4 pb-4 text-center text-body-s text-on-surface-variant">
          그룹의 <b className="text-on-surface">+ 추가</b>로 현재 검색을 저장하세요
        </p>
      )}
    </aside>
  );
}
