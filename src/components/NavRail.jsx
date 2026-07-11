import {
  IconTablet,
  IconWaystone,
  IconInfo,
  IconChevronLeft,
  IconClose,
} from "./icons.jsx";

const NAV_ITEMS = [
  { key: "tablet", label: "서판", Icon: IconTablet },
  { key: "waystone", label: "경로석", Icon: IconWaystone },
];

// 내비게이션 항목 하나. collapsed=true면 아이콘 위 라벨(M3 rail), false면 아이콘+라벨 가로 pill.
function NavItem({ Icon, label, active, collapsed, onClick }) {
  if (collapsed) {
    return (
      <button onClick={onClick} className="group flex w-full flex-col items-center gap-1 py-1.5">
        <span
          className={`flex h-8 w-14 items-center justify-center rounded-full transition ${
            active
              ? "bg-secondary-container text-on-secondary-container"
              : "text-on-surface-variant group-hover:bg-surface-c-high"
          }`}
        >
          <Icon width={22} height={22} />
        </span>
        <span className={`text-label-s ${active ? "text-on-surface" : "text-on-surface-variant"}`}>
          {label}
        </span>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-full px-4 py-3 text-label-l transition ${
        active
          ? "bg-secondary-container text-on-secondary-container"
          : "text-on-surface-variant hover:bg-surface-c-high"
      }`}
    >
      <Icon width={22} height={22} />
      <span>{label}</span>
    </button>
  );
}

// 좌측 내비게이션. overlay=true면 좁은 화면용 드로어(scrim), 아니면 정적 레일.
export default function NavRail({
  tab,
  onTab,
  onCredits,
  overlay = false,
  open = false,
  onClose,
  collapsed = false,
  showCollapseToggle = false,
  onToggleCollapse,
}) {
  // 드로어 내부는 항상 펼친 형태(라벨 노출)
  const inner = (drawer) => (
    <div className="flex h-full flex-col gap-1 p-3">
      {/* 브랜드 */}
      <div className={`mb-2 flex items-center gap-2 px-2 py-2 ${collapsed && !drawer ? "justify-center" : ""}`}>
        <IconWaystone width={24} height={24} className="text-primary" />
        {(!collapsed || drawer) && (
          <span className="font-cinzel text-title-m font-bold tracking-wide text-primary">
            PoE2
          </span>
        )}
        {drawer && (
          <button onClick={onClose} className="ml-auto rounded-full p-1 text-on-surface-variant hover:bg-surface-c-high">
            <IconClose width={20} height={20} />
          </button>
        )}
      </div>

      {/* 메뉴 */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((it) => (
          <NavItem
            key={it.key}
            Icon={it.Icon}
            label={it.label}
            active={tab === it.key}
            collapsed={collapsed && !drawer}
            onClick={() => {
              onTab(it.key);
              if (drawer) onClose?.();
            }}
          />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        {/* 정보 · 문의 (문의는 GitHub Issues 링크로) */}
        <NavItem
          Icon={IconInfo}
          label="정보·문의"
          active={false}
          collapsed={collapsed && !drawer}
          onClick={() => {
            onCredits?.();
            if (drawer) onClose?.();
          }}
        />
        {/* 접기/펴기 (정적 레일 + 넓은 화면에서만) */}
        {showCollapseToggle && !drawer && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "메뉴 펴기" : "메뉴 접기"}
            className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-label-l text-on-surface-variant transition hover:bg-surface-c-high ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <IconChevronLeft
              width={22}
              height={22}
              className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
            {!collapsed && <span>접기</span>}
          </button>
        )}
      </div>
    </div>
  );

  if (overlay) {
    return (
      <>
        {/* scrim */}
        <div
          onClick={onClose}
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface-c-low shadow-2xl transition-transform ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {inner(true)}
        </aside>
      </>
    );
  }

  return (
    <aside
      className={`shrink-0 border-r border-outline-variant bg-surface-c-low transition-[width] ${
        collapsed ? "w-20" : "w-60"
      }`}
    >
      {inner(false)}
    </aside>
  );
}
