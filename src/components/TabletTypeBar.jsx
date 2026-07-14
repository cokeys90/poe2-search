import { TABLET_META, TABLET_TYPES, tabletName } from "../data/options.js";
import { TabletIcon } from "./GameIcon.jsx";

export default function TabletTypeBar({ value, onChange }) {
  return (
    <div className="mb-2.5 flex flex-wrap gap-2">
      {TABLET_TYPES.map((t) => {
        const meta = TABLET_META[t];
        const active = value === t;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={[
              "inline-flex items-center gap-2 rounded-md-s border px-4 py-2 text-label-l transition-colors",
              active
                ? "text-surface"
                : "border-outline-variant bg-surface-c text-on-surface-variant hover:bg-surface-c-high",
            ].join(" ")}
            style={active ? { background: meta.color, borderColor: meta.color } : undefined}
          >
            <TabletIcon type={t} width={20} />
            {tabletName(t)}
          </button>
        );
      })}
    </div>
  );
}
