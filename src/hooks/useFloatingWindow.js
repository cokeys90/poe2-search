import { useState, useEffect, useMemo, useCallback } from "react";
import { loadWinState, saveWinState, defaultWinState } from "../lib/storage.js";

export const WIN_MIN_W = 260;
export const WIN_MIN_H = 240;
const MARGIN = 8; // 뷰포트 가장자리 최소 여백
const DEFAULT_GAP = 24; // 기본 위치(우하단) 여백

function viewport() {
  return { w: window.innerWidth, h: window.innerHeight };
}

// 저장된 창 좌표/크기를 현재 뷰포트 안으로 보정. x/y가 null이면 우하단 기본 위치.
// 창 전체가 뷰포트 안에 들어오게 한다 — 리사이즈 핸들(우하단)이 항상 잡히도록.
export function clampGeom(g, vp = viewport()) {
  const w = Math.min(Math.max(g.w, WIN_MIN_W), Math.max(WIN_MIN_W, vp.w - MARGIN * 2));
  const h = Math.min(Math.max(g.h, WIN_MIN_H), Math.max(WIN_MIN_H, vp.h - MARGIN * 2));
  const rawX = g.x ?? vp.w - w - DEFAULT_GAP;
  const rawY = g.y ?? vp.h - h - DEFAULT_GAP;
  const x = Math.min(Math.max(rawX, MARGIN), Math.max(MARGIN, vp.w - w - MARGIN));
  const y = Math.min(Math.max(rawY, MARGIN), Math.max(MARGIN, vp.h - h - MARGIN));
  return { x, y, w, h };
}

// 플로팅 창(즐겨찾기·설정)의 위치·크기·표시모드·열림 상태. storageKey별로 따로 영속.
// 저장값은 그대로 두고, 뷰포트가 좁아졌을 때는 "표시만" 보정한다 —
// 브라우저를 다시 넓히면 원래 위치로 돌아오는 편이 덜 놀랍다.
export function useFloatingWindow(storageKey) {
  const [state, setState] = useState(() => loadWinState(storageKey));
  const [vp, setVp] = useState(viewport);

  useEffect(() => {
    saveWinState(storageKey, state);
  }, [storageKey, state]);

  useEffect(() => {
    const onResize = () => setVp(viewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const geom = useMemo(() => clampGeom(state, vp), [state, vp]);

  const setGeom = useCallback((g) => setState((s) => ({ ...s, ...g })), []);
  const setView = useCallback((view) => setState((s) => ({ ...s, view })), []);
  const toggleOpen = useCallback(() => setState((s) => ({ ...s, open: !s.open })), []);
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  // 위치·크기만 기본값으로 (열림 상태·표시모드는 유지)
  const resetGeom = useCallback(
    () =>
      setState((s) => {
        const d = defaultWinState(storageKey);
        return { ...s, x: d.x, y: d.y, w: d.w, h: d.h };
      }),
    [storageKey]
  );

  return {
    geom,
    view: state.view,
    open: state.open,
    setGeom,
    setView,
    toggleOpen,
    close,
    resetGeom,
  };
}
