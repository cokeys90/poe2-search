import Segmented from "./Segmented.jsx";
import PinButton from "./PinButton.jsx";
import { WaystoneIcon } from "./GameIcon.jsx";
import { TOKENS } from "../data/options.js";
import { t } from "../i18n/index.js";

// 등급 표기는 언어마다 어순이 다르다 ("15등급" / "Tier 15") → 로케일의 틀을 쓴다
const tierLabel = (n) => TOKENS.tier.replace("{n}", n);

// 필터 카드 안에 들어가는 조각들 (카드 테두리는 App이 그린다).
// 라벨은 언어별이라 렌더 시점에 만든다
const CORRUPT_OPTS = [
  { value: "any", i18n: "filter.corrupt.any" },
  { value: "yes", i18n: "filter.corrupt.yes" },
  { value: "no", i18n: "filter.corrupt.no" },
];

// 16 → 1 등급 (게임 목록과 같은 내림차순, 4×4 격자)
const TIERS = Array.from({ length: 16 }, (_, i) => String(16 - i));

export function CorruptFilter({ corrupt, onCorrupt, pinned, onTogglePin }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-label-l text-on-surface">{t("filter.corrupt")}</span>
      <Segmented value={corrupt} onChange={onCorrupt} options={CORRUPT_OPTS} />
      {corrupt !== "any" && <PinButton pinned={pinned} onClick={onTogglePin} />}
    </div>
  );
}

// 경로석 등급 — 아이콘 4×4 격자 (16T → 1T)
export function TierGrid({ tier, onTier, pinned, onTogglePin }) {
  return (
    <div className="flex shrink-0 flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-label-l text-on-surface">{t("filter.tier")}</span>
        <button
          onClick={() => onTier("")}
          className={`rounded-md-xs border px-2.5 py-0.5 text-label-m transition ${
            tier === ""
              ? "border-primary bg-secondary-container text-on-secondary-container"
              : "border-outline text-on-surface-variant hover:bg-surface-c-high"
          }`}
        >
          {t("filter.tier.any")}
        </button>
        {tier !== "" && <PinButton pinned={pinned} onClick={onTogglePin} />}
      </div>
      <div className="grid w-fit grid-cols-4 gap-1.5">
        {/* map 변수를 n 으로 둔다 — t 는 번역 함수라 가려지면 안 된다 */}
        {TIERS.map((n) => {
          const active = tier === n;
          return (
            <button
              key={n}
              onClick={() => onTier(n)}
              title={tierLabel(n)}
              className={`flex w-14 flex-col items-center gap-0.5 rounded-md-s border py-1.5 transition ${
                active
                  ? "border-primary bg-secondary-container"
                  : "border-outline-variant hover:bg-surface-c-high"
              }`}
            >
              <WaystoneIcon tier={n} width={26} />
              <span
                className={`text-label-s ${
                  active ? "text-on-secondary-container" : "text-on-surface-variant"
                }`}
              >
                {n}T
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
