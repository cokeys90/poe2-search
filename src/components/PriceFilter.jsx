import Segmented from "./Segmented.jsx";
import PinButton from "./PinButton.jsx";
import { t } from "../i18n/index.js";
import { CURRENCIES, currency as currencyOf } from "../lib/currency.js";

// 가격 필터 (경로석·서판 공통). 상인 판매가를 정확히/범위로 제한하는 검색 세트 생성.
// 화폐 정의는 lib/currency.js — 인게임 검색어와 거래소가 같은 것을 다르게 쓴다.

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

      {/* "엑잘티드 오브 상당"은 거래소가 환산해 주는 개념이라 인게임엔 없다 →
          검색어엔 가격이 안 들어간다. 조용히 빠지면 사용자가 속는다. */}
      {enabled && currencyOf(currency).tradeOnly && (
        <span className="text-body-s text-on-surface-variant">{t("filter.price.tradeOnly")}</span>
      )}
    </div>
  );
}
