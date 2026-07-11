// 등급(경로석 전용) · 타락(공통) 필터.
const CORRUPT_OPTS = [
  ["any", "무관"],
  ["yes", "타락만"],
  ["no", "비타락만"],
];

function PinBtn({ pinned, onClick }) {
  return (
    <button
      onClick={onClick}
      title={pinned ? "고정 해제" : "고정 (다음에도 유지)"}
      className={`px-1 transition ${
        pinned ? "text-gold-hi" : "text-mute/50 hover:text-gold"
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
    <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-edge bg-bg1 px-4 py-3">
      {/* 타락 (경로석·서판 공통) */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-ink">타락</span>
        <div className="flex gap-1 rounded-lg border border-edge bg-bg0 p-1">
          {CORRUPT_OPTS.map(([v, label]) => (
            <button
              key={v}
              onClick={() => onCorrupt(v)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                corrupt === v ? "bg-gold/20 text-gold-hi" : "text-mute hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {corrupt !== "any" && (
          <PinBtn pinned={corruptPinned} onClick={onTogglePinCorrupt} />
        )}
      </div>

      {/* 등급 (경로석 전용) */}
      {tab === "waystone" && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">등급</span>
          <select
            value={tier}
            onChange={(e) => onTier(e.target.value)}
            className="rounded-md border border-edge bg-bg0 px-2 py-1.5 text-sm text-ink outline-none transition focus:border-gold/60"
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
