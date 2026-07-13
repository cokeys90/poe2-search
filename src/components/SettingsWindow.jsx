import FloatingWindow from "./FloatingWindow.jsx";
import Tooltip from "./Tooltip.jsx";
import { IconSettings, IconClose, IconReset } from "./icons.jsx";
import { LEAGUES } from "../lib/trade.js";

// 설정 항목 한 줄: 설명 + 실행 버튼
function Row({ title, desc, actionLabel, onAction, disabled }) {
  return (
    <div className="flex items-center gap-3 rounded-md-s border border-outline-variant bg-surface-c px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-label-l text-on-surface">{title}</p>
        <p className="text-body-s text-on-surface-variant">{desc}</p>
      </div>
      <button
        onClick={onAction}
        disabled={disabled}
        className="flex shrink-0 items-center gap-1 rounded-md-s bg-secondary-container px-3 py-1.5 text-label-m text-on-secondary-container transition hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
      >
        <IconReset width={16} />
        {actionLabel}
      </button>
    </div>
  );
}

// 설정 창 — 즐겨찾기 창과 같은 플로팅 셸(이동·리사이즈·위치 저장)을 쓴다.
export default function SettingsWindow({
  geom,
  onGeom,
  fullscreen,
  onClose,
  onResetFavWindow,
  onResetOptPrefs,
  optPrefsDirty,
  league,
  onLeague,
}) {
  const header = (
    <div className="flex items-center gap-2 border-b border-outline-variant bg-surface-c-low px-3 py-2.5">
      <IconSettings width={20} className="shrink-0 text-primary" />
      <span className="mr-auto truncate text-title-s text-on-surface">설정</span>
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
    <FloatingWindow geom={geom} onCommit={onGeom} fullscreen={fullscreen} onClose={onClose} header={header}>
      <div className="flex flex-col gap-2 p-3">
        {/* 거래소 리그 — 리그 목록 API는 CORS가 없어 조회 불가라 직접 고른다 */}
        <div className="flex items-center gap-3 rounded-md-s border border-outline-variant bg-surface-c px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-label-l text-on-surface">거래소 리그</p>
            <p className="text-body-s text-on-surface-variant">
              "거래소" 버튼으로 열릴 리그
            </p>
          </div>
          <select
            value={league}
            onChange={(e) => onLeague(e.target.value)}
            className="shrink-0 rounded-md-s border border-outline bg-surface-c-lowest px-2 py-1.5 text-body-m text-on-surface outline-none transition focus:border-primary"
          >
            {LEAGUES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <Row
          title="즐겨찾기 창 크기·위치 초기화"
          desc="창을 기본 크기(480×840)로, 우하단 기본 위치로 되돌린다"
          actionLabel="초기화"
          onAction={onResetFavWindow}
        />
        <Row
          title="옵션 순서·숨김 초기화"
          desc="직접 바꾼 옵션 순서와 숨긴 옵션을 모두 원래대로"
          actionLabel="초기화"
          onAction={onResetOptPrefs}
          disabled={!optPrefsDirty}
        />
      </div>
    </FloatingWindow>
  );
}
