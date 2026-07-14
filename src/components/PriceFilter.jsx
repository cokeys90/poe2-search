import Segmented from "./Segmented.jsx";
import PinButton from "./PinButton.jsx";
import { t } from "../i18n/index.js";

// 가격 필터 (경로석·서판 공통). 상인 판매가를 정확히/범위로 제한하는 검색 세트 생성.
export const CURRENCIES = [
  // ⚠️ 검색어에는 영어 화폐명이 그대로 박힌다(pricePiece) — 게임이 상인 판매가를 영어로
  //    표시한다는 전제다. 다른 언어 클라이언트에서도 그런지는 확인이 필요하다.
  { key: "exalted", i18n: "currency.exalted" },
  { key: "chaos", i18n: "currency.chaos" },
  { key: "divine", i18n: "currency.divine" },
];

const INPUT_CLS =
  "w-20 rounded-md-s border border-outline bg-surface-c-lowest px-2 py-1.5 text-center font-mono text-body-m text-primary outline-none transition focus:border-primary placeholder:text-on-surface-variant/50";

const SELECT_CLS =
  "rounded-md-s border border-outline bg-surface-c-lowest px-2 py-1.5 text-body-m text-on-surface outline-none transition focus:border-primary";

export default function PriceFilter({ value, onChange, pinned, onTogglePin }) {
  const { enabled, mode, min, max, currency } = value;
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex w-12 shrink-0 cursor-pointer select-none items-center gap-2 text-label-l text-on-surface">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => set({ enabled: e.target.checked })}
          className="accent-primary"
        />
        {t("filter.price")}
      </label>

      {enabled && <PinButton pinned={pinned} onClick={onTogglePin} />}

      {/* 입력은 항상 보인다 — 체크 해제 시엔 비활성(수정 불가)만 된다 */}
      <div
        className={`flex flex-wrap items-center gap-3 transition-opacity ${
          enabled ? "" : "pointer-events-none opacity-40"
        }`}
        aria-disabled={!enabled}
      >
        {/* 모드: 정확히 / 범위 */}
        <Segmented
          value={mode}
          onChange={(m) => set({ mode: m })}
          options={[
            { value: "exact", label: t("filter.exact") },
            { value: "range", label: t("filter.range") },
          ]}
        />

        {/* 값 입력 */}
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            disabled={!enabled}
            placeholder={mode === "range" ? t("filter.min") : t("filter.value")}
            value={min}
            onChange={(e) => set({ min: e.target.value })}
            className={INPUT_CLS}
          />
          {mode === "range" && (
            <>
              <span className="text-on-surface-variant">~</span>
              <input
                type="number"
                min="0"
                disabled={!enabled}
                placeholder={t("filter.max")}
                value={max}
                onChange={(e) => set({ max: e.target.value })}
                className={INPUT_CLS}
              />
            </>
          )}
        </div>

        {/* 화폐 드롭다운 */}
        <select
          value={currency}
          disabled={!enabled}
          onChange={(e) => set({ currency: e.target.value })}
          className={SELECT_CLS}
        >
          {CURRENCIES.map((c) => (
            <option key={c.key} value={c.key}>
              {t(c.i18n)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
