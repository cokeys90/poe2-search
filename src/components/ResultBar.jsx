import { useState } from "react";
import { hasNumeric, rangeHint } from "../lib/regex.js";
import PinButton from "./PinButton.jsx";
import Tooltip from "./Tooltip.jsx";
import { IconTrade, IconImport, IconStar } from "./icons.jsx";
import { t } from "../i18n/index.js";

// 선택 옵션이 어느 드롭존에 속하는가. buildPattern과 같은 폴백을 써서
// 화면(존 위치)과 검색어(AND/OR)가 어긋나지 않게 한다.
function zoneOf(s, mode) {
  if (s.mode === "exc") return "exc";
  return (s.req ?? mode === "and") ? "req" : "opt";
}

const ZONES = [
  { id: "req", label: "result.zoneReq", tip: "result.zoneReqTip", accent: "primary" },
  { id: "opt", label: "result.zoneOpt", tip: "result.zoneOptTip", accent: "tertiary" },
  { id: "exc", label: "result.zoneExc", tip: "result.zoneExcTip", accent: "error" },
];

// 존별 색 — 옵션 목록 그룹 헤더(접두어/접미어)와 같은 결로, 존마다 색만 다르게.
const ACCENT = {
  primary: {
    text: "text-primary",
    chip: "border-primary/40 bg-primary-container/25",
    ring: "border-primary/60 bg-primary-container/10",
  },
  tertiary: {
    text: "text-tertiary",
    chip: "border-tertiary/40 bg-tertiary-container/30",
    ring: "border-tertiary/60 bg-tertiary-container/10",
  },
  error: {
    text: "text-error",
    chip: "border-error/40 bg-error-container/30",
    ring: "border-error/60 bg-error-container/10",
  },
};

export default function ResultBar({
  pattern,
  len,
  copied,
  onCopy,
  onClear,
  selList,
  mode,
  onSetGroup,
  onRemove,
  onSetValue,
  pinnedOptions = {},
  onTogglePin,
  onTrade,
  tradeSkipped = [],
  onTradeImport,
}) {
  const [dragId, setDragId] = useState(null);
  const [overZone, setOverZone] = useState(null);
  const dragging = dragId != null;

  const buckets = { req: [], opt: [], exc: [] };
  for (const [id, s] of selList) buckets[zoneOf(s, mode)].push([id, s]);

  const drop = (zone) => {
    if (dragId) onSetGroup(dragId, zone);
    setDragId(null);
    setOverZone(null);
  };

  return (
    <div className="sticky top-3 z-20 my-6 rounded-md-l border border-outline-variant bg-surface-c-low p-5 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-title-s text-on-surface">{t("result.title")}</span>
        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-label-m ${
              len > 250 ? "text-error" : "text-on-surface-variant"
            }`}
          >
            {len} / 250
          </span>
          <Tooltip label={t("result.importTip")}>
            <button
              onClick={onTradeImport}
              className="flex items-center gap-1 rounded-md-s px-2.5 py-1.5 text-label-l text-on-surface-variant transition hover:bg-surface-c-high hover:text-on-surface"
            >
              <IconImport width={17} />
              {t("result.import")}
            </button>
          </Tooltip>
          <Tooltip
            label={
              tradeSkipped.length
                ? t("result.tradeTipSkipped", { n: tradeSkipped.length })
                : t("result.tradeTip")
            }
          >
            <button
              onClick={onTrade}
              disabled={selList.length === 0}
              className="flex items-center gap-1 rounded-md-s bg-secondary-container px-3 py-1.5 text-label-l text-on-secondary-container transition hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
            >
              <IconTrade width={17} />
              {t("result.trade")}
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
            {copied ? t("result.copied") : t("result.copy")}
          </button>
          <button
            onClick={onClear}
            className="rounded-md-s px-3 py-1.5 text-label-l text-on-surface-variant transition hover:bg-surface-c-high"
          >
            {t("result.reset")}
          </button>
        </div>
      </div>

      {/* 결과 코드 */}
      <div className="flex min-h-[104px] items-start break-all rounded-md-s border border-outline-variant bg-surface-c-lowest px-4 py-4 font-mono text-body-l leading-relaxed text-on-surface">
        {pattern || (
          <span className="text-on-surface-variant/60">{t("result.empty")}</span>
        )}
      </div>

      {/* 필수 / 선택 / 제외 드롭존 — 칩을 끌어 옮긴다. 비어 있어도 드래그 중엔 드롭 대상으로 뜬다 */}
      {selList.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {ZONES.map((z) => {
            const chips = buckets[z.id];
            // 필수 존은 비어 있어도 항상 보여준다 — "여기로 끌어다 놓기"가 유일한 발견 경로라서.
            // 선택·제외는 비면 감추되 드래그 중엔 드롭 대상으로 띄운다.
            if (!chips.length && !dragging && z.id !== "req") return null;
            const c = ACCENT[z.accent];
            const active = overZone === z.id;
            return (
              <div
                key={z.id}
                onDragOver={(e) => {
                  if (!dragging) return;
                  e.preventDefault();
                  setOverZone(z.id);
                }}
                onDragLeave={() => setOverZone((v) => (v === z.id ? null : v))}
                onDrop={(e) => {
                  e.preventDefault();
                  drop(z.id);
                }}
                className={`rounded-md-s border p-2 transition ${
                  active
                    ? c.ring
                    : dragging
                      ? "border-dashed border-outline-variant bg-surface-c-lowest/40"
                      : "border-transparent"
                }`}
              >
                <div className="mb-2 flex items-center gap-2 px-0.5">
                  <span className={`font-cinzel text-label-m uppercase tracking-[2px] ${c.text}`}>
                    {t(z.label)}
                  </span>
                  {chips.length > 0 && (
                    <span className="rounded-full border border-outline-variant px-2 py-0.5 text-label-s text-on-surface-variant">
                      {chips.length}
                    </span>
                  )}
                  <span className="text-label-s text-on-surface-variant/70">{t(z.tip)}</span>
                </div>
                {chips.length ? (
                  <div className="flex flex-wrap gap-2">
                    {chips.map(([id, s]) => (
                      <Chip
                        key={id}
                        id={id}
                        s={s}
                        zone={z.id}
                        accent={c.chip}
                        pinned={pinnedOptions[id]}
                        onSetGroup={onSetGroup}
                        onDragStart={() => setDragId(id)}
                        onDragEnd={() => {
                          setDragId(null);
                          setOverZone(null);
                        }}
                        onTogglePin={() => onTogglePin(id)}
                        onRemove={() => onRemove(id)}
                        onSetValue={onSetValue}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="px-1 py-1.5 text-label-s text-on-surface-variant/50">
                    {t("result.dropHere")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chip({ id, s, zone, accent, pinned, onSetGroup, onDragStart, onDragEnd, onTogglePin, onRemove, onSetValue }) {
  const numeric = hasNumeric(s.text) || s.numeric;
  const isReq = zone === "req";
  const hint =
    s.rmin != null && s.rmax != null ? s.rmin + "-" + s.rmax : rangeHint(s.text);
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md-s border py-1 pl-1 pr-1.5 text-label-m ${accent}`}
    >
      {/* 드래그 핸들 — 입력창과 충돌하지 않게 이 손잡이에만 draggable을 건다 */}
      <span
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        title={t("result.dragTip")}
        className="cursor-grab select-none px-1 text-on-surface-variant/50 hover:text-on-surface active:cursor-grabbing"
      >
        ⠿
      </span>
      <span className="max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap font-mono text-on-surface">
        {s.frag}
      </span>
      {numeric && (
        // 최소 ~ 최대. 칩은 칸이 떨어져 있어 선 대신 물결로 잇는다
        <span className="flex items-center gap-0.5">
          {["min", "max"].map((which, i) => (
            <span key={which} className="flex items-center gap-0.5">
              {i === 1 && (
                <span className="text-label-s text-on-surface-variant/60">~</span>
              )}
              <input
                type="number"
                placeholder={hint && hint.includes("-") ? hint.split("-")[i] : i ? "≤" : "≥"}
                value={s[which] || ""}
                onChange={(e) => onSetValue(id, which, e.target.value)}
                className="w-11 rounded-md-xs border border-outline bg-surface-c-lowest px-1 py-0.5 text-center font-mono text-label-m text-primary outline-none transition focus:border-primary placeholder:text-on-surface-variant/50"
              />
            </span>
          ))}
        </span>
      )}
      {/* 필수 토글 — 드래그 없이 한 번에 선택↔필수. 제외 칩엔 뜻이 없어 감춘다 */}
      {zone !== "exc" && (
        <button
          onClick={() => onSetGroup(id, isReq ? "opt" : "req")}
          title={isReq ? t("result.reqOff") : t("result.reqOn")}
          className={`px-1 transition ${
            isReq ? "text-primary" : "text-on-surface-variant/50 hover:text-primary"
          }`}
        >
          <IconStar width={16} />
        </button>
      )}
      <PinButton pinned={pinned} onClick={onTogglePin} />
      <button
        onClick={onRemove}
        title={t("result.removeTip")}
        className="px-1.5 text-label-s text-on-surface-variant transition hover:text-error"
      >
        {t("result.remove")}
      </button>
    </div>
  );
}
