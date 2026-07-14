import { useEffect, useRef } from "react";
import { clampGeom } from "../hooks/useFloatingWindow.js";
import { t } from "../i18n/index.js";

// 앱 화면 위에 뜨는 non-modal 창 셸. 헤더 드래그로 이동, 우하단 코너로 리사이즈.
// 스크림 없음 · 바깥 클릭해도 닫히지 않음 (창을 띄운 채 옵션을 고르는 동선이 핵심).
// 내용은 모른다 — header/children만 받는다.
//  - geom: { x, y, w, h } (뷰포트 기준 px, 이미 클램프된 값)
//  - onCommit(geom): 드래그·리사이즈가 끝난 시점에만 호출 (드래그 중엔 DOM 직접 갱신)
//  - fullscreen: 좁은 화면 fallback — 전체화면 시트로 렌더, 이동·리사이즈 없음
export default function FloatingWindow({ geom, onCommit, fullscreen, onClose, header, children }) {
  const winRef = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 드래그 중에는 setState 대신 DOM 스타일을 직접 갱신한다 —
  // 창 안에 즐겨찾기 트리가 통째로 있어 매 프레임 리렌더하면 눈에 띄게 버벅인다.
  const begin = (mode) => (e) => {
    if (e.button !== 0 || fullscreen) return;
    if (mode === "move" && e.target.closest("button, input")) return; // 헤더 버튼은 드래그 아님
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { mode, sx: e.clientX, sy: e.clientY, base: geom, next: null };
    document.body.style.userSelect = "none";
  };

  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    const g =
      d.mode === "move"
        ? { ...d.base, x: d.base.x + dx, y: d.base.y + dy }
        : { ...d.base, w: d.base.w + dx, h: d.base.h + dy };
    const next = clampGeom(g);
    d.next = next;
    const el = winRef.current;
    el.style.left = `${next.x}px`;
    el.style.top = `${next.y}px`;
    el.style.width = `${next.w}px`;
    el.style.height = `${next.h}px`;
  };

  const end = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    document.body.style.userSelect = "";
    if (d.next) onCommit(d.next);
  };

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-surface-c-low">
        <div className="shrink-0">{header}</div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    );
  }

  return (
    <div
      ref={winRef}
      role="dialog"
      aria-label={t("favs.title")}
      style={{ left: geom.x, top: geom.y, width: geom.w, height: geom.h }}
      className="fixed z-40 flex flex-col overflow-hidden rounded-md-l border border-outline-variant bg-surface-c-low shadow-2xl"
    >
      <div
        onPointerDown={begin("move")}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        className="shrink-0 cursor-grab active:cursor-grabbing"
      >
        {header}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

      {/* 우하단 리사이즈 핸들 — 눈에 띄게: 배경 삼각형 + 굵은 그립선, hover 시 강조 */}
      <div
        onPointerDown={begin("resize")}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        title={t("window.resize")}
        className="group/rs absolute bottom-0 right-0 h-6 w-6 cursor-nwse-resize"
      >
        <div className="absolute inset-0 rounded-br-md-l bg-secondary-container/70 transition group-hover/rs:bg-secondary-container [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
        <svg
          viewBox="0 0 24 24"
          className="absolute inset-0 h-6 w-6 text-on-secondary-container/70 transition group-hover/rs:text-on-secondary-container"
        >
          <path
            d="M21 9 9 21M21 15l-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}
