// 가격 필터 (경로석·서판 공통). 상인 판매가를 정확히/범위로 제한하는 검색 세트 생성.
export const CURRENCIES = [
  { key: "exalted", label: "엑절티드" },
  { key: "chaos", label: "카오스" },
  { key: "divine", label: "디바인" },
];

export default function PriceFilter({ value, onChange }) {
  const { enabled, mode, min, max, currency } = value;
  const set = (patch) => onChange({ ...value, ...patch });

  const inputCls =
    "w-20 rounded-md border border-edge bg-bg0 px-2 py-1.5 text-center font-mono text-sm text-gold-hi outline-none transition focus:border-gold/60 placeholder:text-[#5a4e3a]";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-edge bg-bg1 px-4 py-3">
      <label className="flex cursor-pointer select-none items-center gap-2 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => set({ enabled: e.target.checked })}
          className="accent-gold"
        />
        가격 제한
      </label>

      {enabled && (
        <>
          {/* 모드: 정확히 / 범위 */}
          <div className="flex gap-1 rounded-lg border border-edge bg-bg0 p-1">
            <button
              onClick={() => set({ mode: "exact" })}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                mode === "exact" ? "bg-gold/20 text-gold-hi" : "text-mute hover:text-ink"
              }`}
            >
              정확히
            </button>
            <button
              onClick={() => set({ mode: "range" })}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                mode === "range" ? "bg-gold/20 text-gold-hi" : "text-mute hover:text-ink"
              }`}
            >
              범위
            </button>
          </div>

          {/* 값 입력 */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              placeholder={mode === "range" ? "최소" : "값"}
              value={min}
              onChange={(e) => set({ min: e.target.value })}
              className={inputCls}
            />
            {mode === "range" && (
              <>
                <span className="text-mute">~</span>
                <input
                  type="number"
                  min="0"
                  placeholder="최대"
                  value={max}
                  onChange={(e) => set({ max: e.target.value })}
                  className={inputCls}
                />
              </>
            )}
          </div>

          {/* 화폐 드롭다운 */}
          <select
            value={currency}
            onChange={(e) => set({ currency: e.target.value })}
            className="rounded-md border border-edge bg-bg0 px-2 py-1.5 text-sm text-ink outline-none transition focus:border-gold/60"
          >
            {CURRENCIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
