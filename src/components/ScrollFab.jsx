import { useState } from "react";

// M3 Speed Dial FAB — 스크롤 컨테이너 내에서 최상단/접두어/접미어로 점프.
const ACTIONS = [
  { key: "top", label: "최상단", icon: "vertical_align_top" },
  { key: "prefix", label: "접두어", icon: "north" },
  { key: "suffix", label: "접미어", icon: "south" },
];

export default function ScrollFab({ scrollRef, rightInset = 24 }) {
  const [open, setOpen] = useState(false);

  const go = (key) => {
    const el = scrollRef.current;
    if (el) {
      if (key === "top") {
        el.scrollTo({ top: 0 });
      } else {
        const sel = key === "prefix" ? "[data-group*='접두']" : "[data-group*='접미']";
        const target = el.querySelector(sel);
        if (target) {
          // sticky 검색어 바 높이만큼 보정해 그룹 제목이 바로 보이게
          const bar = el.querySelector(".sticky");
          const barH = bar ? bar.offsetHeight : 0;
          const top =
            el.scrollTop +
            target.getBoundingClientRect().top -
            el.getBoundingClientRect().top -
            barH -
            12;
          el.scrollTo({ top: Math.max(0, top) });
        }
      }
    }
    setOpen(false);
  };

  return (
    <div
      className="fixed bottom-6 z-30 flex flex-col items-end gap-3"
      style={{ right: rightInset }}
    >
      {open &&
        ACTIONS.map((a) => (
          <button key={a.key} onClick={() => go(a.key)} className="flex items-center gap-2">
            <span className="rounded-md-xs bg-surface-c-highest px-2 py-1 text-label-m text-on-surface shadow-md">
              {a.label}
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-md-m bg-secondary-container text-on-secondary-container shadow-lg">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                {a.icon}
              </span>
            </span>
          </button>
        ))}
      <button
        onClick={() => setOpen((o) => !o)}
        title="이동"
        className="flex h-14 w-14 items-center justify-center rounded-md-l bg-primary-container text-on-primary-container shadow-xl transition hover:brightness-110"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 26 }}>
          {open ? "close" : "unfold_more"}
        </span>
      </button>
    </div>
  );
}
