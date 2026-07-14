import { IconInfo, IconChevronLeft, IconClose } from "./icons.jsx";
import { TabletIcon, WaystoneIcon } from "./GameIcon.jsx";
import { t } from "../i18n/index.js";

// 메뉴 아이콘은 대표 아이템 그림 — 서판=방사능, 경로석=15등급.
// 경로석은 아래로 갈수록 가늘어지는 원형이라 같은 크기에서 라벨과의 간격이 떠 보인다 → 광학 보정(살짝 크게 + 1px 내림).
const NAV_ITEMS = [
  { key: "tablet", i18n: "nav.tablet", Icon: (p) => <TabletIcon {...p} /> },
  {
    key: "waystone",
    i18n: "nav.waystone",
    Icon: ({ width = 22, ...p }) => (
      <WaystoneIcon width={width + 2} className="translate-y-px" {...p} />
    ),
  },
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
        <img src="/favicon.png" width={26} height={26} alt="" className="shrink-0" />
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
            label={t(it.i18n)}
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
          label={t("nav.credits")}
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
            title={collapsed ? t("nav.expand") : t("nav.collapse")}
            className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-label-l text-on-surface-variant transition hover:bg-surface-c-high ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <IconChevronLeft
              width={22}
              height={22}
              className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
            {!collapsed && <span>{t("nav.collapseShort")}</span>}
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
