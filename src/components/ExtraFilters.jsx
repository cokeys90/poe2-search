import Segmented from "./Segmented.jsx";
import PinButton from "./PinButton.jsx";

// 등급(경로석 전용) · 타락(공통) 필터.
const CORRUPT_OPTS = [
  { value: "any", label: "무관" },
  { value: "yes", label: "타락만" },
  { value: "no", label: "비타락만" },
];

export default function ExtraFilters({
  tab,
  tier,
  onTier,
  corrupt,
  onCorrupt,
  tierPinned,
  onTogglePinTier,
  corruptPinned,
  onTogglePinCorrupt,
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-md-m border border-outline-variant bg-surface-c px-4 py-3">
      {/* 타락 (경로석·서판 공통) */}
      <div className="flex items-center gap-2">
        <span className="text-label-l text-on-surface">타락</span>
        <Segmented value={corrupt} onChange={onCorrupt} options={CORRUPT_OPTS} />
        {corrupt !== "any" && (
          <PinButton pinned={corruptPinned} onClick={onTogglePinCorrupt} />
        )}
      </div>

      {/* 등급 (경로석 전용) */}
      {tab === "waystone" && (
        <div className="flex items-center gap-2">
          <span className="text-label-l text-on-surface">등급</span>
          <select
            value={tier}
            onChange={(e) => onTier(e.target.value)}
            className="rounded-md-s border border-outline bg-surface-c-lowest px-2 py-1.5 text-body-m text-on-surface outline-none transition focus:border-primary"
          >
            <option value="">무관</option>
            {Array.from({ length: 16 }, (_, i) => 16 - i).map((t) => (
              <option key={t} value={t}>
                {t}등급
              </option>
            ))}
          </select>
          {tier !== "" && <PinButton pinned={tierPinned} onClick={onTogglePinTier} />}
        </div>
      )}
    </div>
  );
}
