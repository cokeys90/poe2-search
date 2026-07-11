import { TABLET_META, TABLET_TYPES } from "../data/options.js";

export default function TabletTypeBar({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2.5 mb-2.5">
      {TABLET_TYPES.map((t) => {
        const meta = TABLET_META[t];
        const active = value === t;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={[
              "inline-flex items-center gap-2 rounded-[10px] border px-5 py-2.5 text-sm font-semibold transition-all",
              active
                ? "text-[#0a0705]"
                : "border-edge bg-bg1 text-mute hover:text-ink hover:border-[#5f4a28]",
            ].join(" ")}
            style={
              active
                ? {
                    background: `linear-gradient(180deg, ${meta.color}, ${meta.color}cc)`,
                    borderColor: meta.color,
                    boxShadow: `0 0 20px ${meta.glow}`,
                  }
                : undefined
            }
          >
            <svg
              className="type-ic"
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill={active ? "#0a0705" : meta.color}
            >
              <path d={meta.icon} />
            </svg>
            {t}
          </button>
        );
      })}
    </div>
  );
}
