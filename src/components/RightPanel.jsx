import { useState } from "react";
import {
  IconStar,
  IconTablet,
  IconWaystone,
  IconEdit,
  IconTrash,
  IconClose,
} from "./icons.jsx";

function FavCard({ fav, onLoad, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(fav.name);
  const count = Object.keys(fav.sel || {}).length;
  const TabIcon = fav.tab === "waystone" ? IconWaystone : IconTablet;
  const tabLabel =
    fav.tab === "waystone" ? "경로석" : `${fav.tabletType || "서판"}`;

  const commit = () => {
    onRename(fav.id, name);
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="rounded-md-m border border-outline-variant bg-surface-c p-3">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="mb-2 w-full rounded-md-s border border-outline bg-surface-c-lowest px-2 py-1.5 text-body-m text-on-surface outline-none focus:border-primary"
        />
        <div className="flex justify-end gap-1">
          <button
            onClick={() => setEditing(false)}
            className="rounded-md-s px-2 py-1 text-label-m text-on-surface-variant hover:bg-surface-c-high"
          >
            취소
          </button>
          <button
            onClick={commit}
            className="rounded-md-s bg-primary-container px-2 py-1 text-label-m text-on-primary-container hover:brightness-110"
          >
            확인
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="group relative rounded-md-m border border-outline-variant bg-surface-c transition-colors hover:bg-surface-c-high">
      <button onClick={() => onLoad(fav)} className="w-full px-3 py-2.5 text-left">
        <div className="mb-1 truncate pr-12 text-label-l text-on-surface">{fav.name}</div>
        <div className="mb-1 flex items-center gap-1.5 text-body-s text-on-surface-variant">
          <TabIcon width={14} className="text-primary" />
          <span>{tabLabel}</span>
          {count > 0 && <span>· {count}옵션</span>}
        </div>
        {fav.pattern && (
          <div className="truncate font-mono text-label-s text-primary/80">{fav.pattern}</div>
        )}
      </button>
      {/* 액션 (hover 시 노출) */}
      <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => setEditing(true)}
          title="이름 변경"
          className="rounded-full p-1 text-on-surface-variant hover:bg-surface-c-highest hover:text-primary"
        >
          <IconEdit width={16} />
        </button>
        <button
          onClick={() => onDelete(fav.id)}
          title="삭제"
          className="rounded-full p-1 text-on-surface-variant hover:bg-surface-c-highest hover:text-error"
        >
          <IconTrash width={16} />
        </button>
      </div>
    </li>
  );
}

// 우측 즐겨찾기 패널.
export default function RightPanel({ favorites = [], onLoad, onDelete, onRename }) {
  return (
    <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-outline-variant bg-surface-c-low xl:block">
      <div className="flex items-center gap-2 border-b border-outline-variant px-5 py-4">
        <IconStar width={20} className="text-primary" />
        <span className="text-title-s text-on-surface">즐겨찾기</span>
        {favorites.length > 0 && (
          <span className="ml-auto rounded-full border border-outline-variant px-2 py-0.5 text-label-s text-on-surface-variant">
            {favorites.length}
          </span>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <IconStar width={40} className="text-outline" />
          <p className="text-body-s text-on-surface-variant">
            검색어의 <b className="text-on-surface">저장</b> 버튼으로
            <br />
            자주 쓰는 조합을 저장하세요
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 p-3">
          {favorites.map((fav) => (
            <FavCard
              key={fav.id}
              fav={fav}
              onLoad={onLoad}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </ul>
      )}
    </aside>
  );
}
