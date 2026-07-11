import Segmented from "./Segmented.jsx";

// 등급(경로석 전용) · 타락(공통) 필터.
const CORRUPT_OPTS = [
  { value: "any", label: "무관" },
  { value: "yes", label: "타락만" },
  { value: "no", label: "비타락만" },
];

function PinBtn({ pinned, onClick }) {
  return (
    <button
      onClick={onClick}
      title={pinned ? "고정 해제" : "고정 (다음에도 유지)"}
      className={`px-1 transition ${
        pinned ? "text-primary" : "text-on-surface-variant/50 hover:text-primary"
      }`}
    >
      📌
    </button>
  );
}

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
          <PinBtn pinned={corruptPinned} onClick={onTogglePinCorrupt} />
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
          {tier !== "" && <PinBtn pinned={tierPinned} onClick={onTogglePinTier} />}
        </div>
      )}
    </div>
  );
}
