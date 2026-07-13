import { hasNumeric, rangeHint } from "../lib/regex.js";
import PinButton from "./PinButton.jsx";
import Tooltip from "./Tooltip.jsx";
import { IconTrade, IconImport } from "./icons.jsx";

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
  onTrade,
  tradeSkipped = [],
  onTradeImport,
}) {
  return (
    <div className="sticky top-3 z-20 my-6 rounded-md-l border border-outline-variant bg-surface-c-low p-5 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-title-s text-on-surface">검색어</span>
        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-label-m ${
              len > 250 ? "text-error" : "text-on-surface-variant"
            }`}
          >
            {len} / 250
          </span>
          <Tooltip label="거래소 검색 링크를 붙여넣어 조건 불러오기">
            <button
              onClick={onTradeImport}
              className="flex items-center gap-1 rounded-md-s px-2.5 py-1.5 text-label-l text-on-surface-variant transition hover:bg-surface-c-high hover:text-on-surface"
            >
              <IconImport width={17} />
              가져오기
            </button>
          </Tooltip>
          <Tooltip
            label={
              tradeSkipped.length
                ? `거래소에서 열기 (옵션 ${tradeSkipped.length}개는 거래소 검색 불가라 제외)`
                : "선택 조건 그대로 공식 거래소에서 열기"
            }
          >
            <button
              onClick={onTrade}
              disabled={selList.length === 0}
              className="flex items-center gap-1 rounded-md-s bg-secondary-container px-3 py-1.5 text-label-l text-on-secondary-container transition hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
            >
              <IconTrade width={17} />
              거래소
              {tradeSkipped.length > 0 && (
                <span className="text-label-s text-on-secondary-container/70">
                  -{tradeSkipped.length}
                </span>
              )}
            </button>
          </Tooltip>
          <button
            onClick={onCopy}
            className="rounded-md-s bg-primary-container px-3 py-1.5 text-label-l text-on-primary-container transition hover:brightness-110"
          >
            {copied ? "복사됨 ✓" : "복사"}
          </button>
          <button
            onClick={onClear}
            className="rounded-md-s px-3 py-1.5 text-label-l text-on-surface-variant transition hover:bg-surface-c-high"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 결과 코드 */}
      <div className="flex min-h-[104px] items-start break-all rounded-md-s border border-outline-variant bg-surface-c-lowest px-4 py-4 font-mono text-body-l leading-relaxed text-on-surface">
        {pattern || (
          <span className="text-on-surface-variant/60">옵션을 선택하면 검색어가 생성됩니다</span>
        )}
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
            const inc = s.mode === "inc";
            return (
              <div
                key={id}
                className={`flex items-center gap-1.5 rounded-md-s border py-1 pl-2.5 pr-1.5 text-label-m ${
                  inc
                    ? "border-tertiary/40 bg-tertiary-container/30"
                    : "border-error/40 bg-error-container/30 pl-1"
                }`}
              >
                {!inc && (
                  <button
                    onClick={() => onFlip(id)}
                    title="제외 → 포함으로 전환"
                    className="rounded-md-xs bg-error-container px-2 py-0.5 text-label-s font-bold text-on-error-container"
                  >
                    제외
                  </button>
                )}
                <span className="max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap font-mono text-on-surface">
                  {s.frag}
                </span>
                {numeric && (
                  <input
                    type="number"
                    placeholder={hint || "≥"}
                    value={s.min || ""}
                    onChange={(e) => onSetMin(id, e.target.value)}
                    className="w-16 rounded-md-xs border border-outline bg-surface-c-lowest px-1.5 py-0.5 text-center font-mono text-label-m text-primary outline-none transition focus:border-primary placeholder:text-on-surface-variant/50"
                  />
                )}
                <PinButton pinned={pinnedOptions[id]} onClick={() => onTogglePin(id)} />
                <button
                  onClick={() => onRemove(id)}
                  title="목록에서 삭제"
                  className="px-1.5 text-label-s text-on-surface-variant transition hover:text-error"
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
