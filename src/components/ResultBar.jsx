import { hasNumeric, rangeHint } from "../lib/regex.js";

export default function ResultBar({
  pattern,
  len,
  copied,
  onCopy,
  onClear,
  selList,
  onFlip,
  onRemove,
  onSetMin,
  pinnedOptions = {},
  onTogglePin,
}) {
  return (
    <div className="sticky top-3 z-20 my-6 rounded-xl border border-edge bg-bg1/95 p-[22px] shadow-[0_8px_30px_rgba(0,0,0,.5)] backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-cinzel text-[15px] font-bold tracking-[2px] text-gold-hi">
          검색어
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-xs ${
              len > 250 ? "text-copper" : "text-mute"
            }`}
          >
            {len} / 250
          </span>
          <button
            onClick={onCopy}
            className="rounded-md border border-gold/50 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-hi transition hover:bg-gold/20"
          >
            {copied ? "복사됨 ✓" : "복사"}
          </button>
          <button
            onClick={onClear}
            className="rounded-md border border-edge px-3 py-1 text-xs text-mute transition hover:text-ink"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 결과 코드 */}
      <div className="flex min-h-[104px] items-start break-all rounded-[10px] border border-edge bg-[#080603] px-5 py-[18px] font-mono text-[16px] leading-[1.75] text-gold-hi shadow-[inset_0_2px_12px_rgba(0,0,0,.6)]">
        {pattern || <span className="text-mute/60">옵션을 선택하면 검색어가 생성됩니다</span>}
      </div>

      {/* 선택 칩 */}
      {selList.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selList.map(([id, s]) => {
            const numeric = hasNumeric(s.text) || s.numeric;
            const hint =
              s.rmin != null && s.rmax != null
                ? s.rmin + "-" + s.rmax
                : rangeHint(s.text);
            return (
              <div
                key={id}
                className={`flex items-center gap-1.5 rounded-full border py-1 pr-1.5 text-xs ${
                  s.mode === "inc"
                    ? "border-rune/50 bg-rune-bg pl-3"
                    : "border-copper/50 bg-copper-bg pl-1"
                }`}
              >
                {s.mode === "exc" && (
                  <button
                    onClick={() => onFlip(id)}
                    title="제외 → 포함으로 전환"
                    className="rounded-full bg-copper-bg px-2.5 py-0.5 text-[11px] font-bold text-[#e09b8b]"
                  >
                    제외
                  </button>
                )}
                <span className="max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap font-mono text-gold">
                  {s.frag}
                </span>
                {numeric && (
                  <input
                    type="number"
                    placeholder={hint || "≥"}
                    value={s.min || ""}
                    onChange={(e) => onSetMin(id, e.target.value)}
                    className="w-16 rounded-md border border-edge bg-[#080603] px-1.5 py-0.5 text-center font-mono text-xs text-gold-hi placeholder:text-[#5a4e3a]"
                  />
                )}
                <button
                  onClick={() => onTogglePin(id)}
                  title={pinnedOptions[id] ? "고정 해제" : "고정 (다음에도 유지)"}
                  className={`px-1 transition ${
                    pinnedOptions[id]
                      ? "text-gold-hi"
                      : "text-mute/50 hover:text-gold"
                  }`}
                >
                  📌
                </button>
                <button
                  onClick={() => onRemove(id)}
                  title="목록에서 삭제"
                  className="px-1.5 text-[11px] text-mute transition hover:text-copper"
                >
                  삭제
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
