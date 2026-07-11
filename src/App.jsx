import { useState, useEffect, useMemo } from "react";
import { DATA } from "./data/options.js";
import { piece, pricePiece, tierPiece } from "./lib/regex.js";
import { optId, useOptionPool } from "./lib/options.js";
import { loadPins, savePins } from "./lib/storage.js";
import TabletTypeBar from "./components/TabletTypeBar.jsx";
import OptionRow from "./components/OptionRow.jsx";
import ResultBar from "./components/ResultBar.jsx";
import PriceFilter from "./components/PriceFilter.jsx";
import ExtraFilters from "./components/ExtraFilters.jsx";

const DEFAULT_PRICE = {
  enabled: false,
  mode: "exact",
  min: "",
  max: "",
  currency: "chaos",
};
const INITIAL_TAB = "tablet";

export default function App() {
  const [pins, setPins] = useState(loadPins); // 고정된 설정 (localStorage)
  const [tab, setTab] = useState(INITIAL_TAB);
  const [tabletType, setTabletType] = useState("탐험");
  // 초기값을 핀에서 복원
  const [sel, setSel] = useState(() => ({ ...pins[INITIAL_TAB].options }));
  const [mode, setMode] = useState("or");
  const [price, setPrice] = useState(() => pins.common.price ?? DEFAULT_PRICE);
  const [tier, setTier] = useState(() => pins.waystone.tier ?? ""); // 경로석 등급 (""=무관)
  const [corrupt, setCorrupt] = useState(() => pins.common.corrupt ?? "any"); // any | yes | no
  const [filter, setFilter] = useState("");
  const [showTrade, setShowTrade] = useState(true);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pool = useOptionPool(tab, tabletType);

  // pins 변경 시 localStorage 저장
  useEffect(() => {
    savePins(pins);
  }, [pins]);

  // 핀된 값이 바뀌면 스냅샷 동기화 (핀 = 현재 값으로 항상 갱신되는 저장)
  useEffect(() => {
    setPins((p) =>
      p.common.price != null && p.common.price !== price
        ? { ...p, common: { ...p.common, price } }
        : p
    );
  }, [price]);
  useEffect(() => {
    setPins((p) =>
      p.common.corrupt != null && p.common.corrupt !== corrupt
        ? { ...p, common: { ...p.common, corrupt } }
        : p
    );
  }, [corrupt]);
  useEffect(() => {
    setPins((p) =>
      p.waystone.tier != null && p.waystone.tier !== tier
        ? { ...p, waystone: { ...p.waystone, tier } }
        : p
    );
  }, [tier]);
  // 핀된 옵션 스냅샷을 현재 탭의 sel 값으로 동기화
  useEffect(() => {
    setPins((p) => {
      const cur = p[tab].options;
      let changed = false;
      const next = {};
      for (const id in cur) {
        if (sel[id]) {
          next[id] = sel[id];
          if (sel[id] !== cur[id]) changed = true;
        } else {
          next[id] = cur[id];
        }
      }
      return changed ? { ...p, [tab]: { ...p[tab], options: next } } : p;
    });
  }, [sel, tab]);

  // 핀 여부 (파생)
  const pinnedOptions = pins[tab].options;
  const pricePinned = pins.common.price != null;
  const corruptPinned = pins.common.corrupt != null;
  const tierPinned = pins.waystone.tier != null;

  function togglePinOption(id) {
    setPins((p) => {
      const opts = { ...p[tab].options };
      if (opts[id]) delete opts[id];
      else if (sel[id]) opts[id] = sel[id];
      else return p;
      return { ...p, [tab]: { ...p[tab], options: opts } };
    });
  }
  function togglePinPrice() {
    setPins((p) => ({
      ...p,
      common: { ...p.common, price: p.common.price != null ? null : price },
    }));
  }
  function togglePinCorrupt() {
    setPins((p) => ({
      ...p,
      common: { ...p.common, corrupt: p.common.corrupt != null ? null : corrupt },
    }));
  }
  function togglePinTier() {
    setPins((p) => ({
      ...p,
      waystone: { ...p.waystone, tier: p.waystone.tier != null ? null : tier },
    }));
  }

  function toggle(item) {
    const id = optId(item.text);
    setSel((prev) => {
      const next = { ...prev };
      if (!next[id]) next[id] = { ...item, mode: "inc", min: "" };
      else if (next[id].mode === "inc") next[id] = { ...next[id], mode: "exc" };
      else delete next[id];
      return next;
    });
  }
  function setMin(id, v) {
    setSel((prev) => ({ ...prev, [id]: { ...prev[id], min: v } }));
  }
  function setOptMin(item, v) {
    const id = optId(item.text);
    setSel((prev) => {
      const cur = prev[id];
      if (cur) return { ...prev, [id]: { ...cur, min: v } };
      if (v === "") return prev;
      return { ...prev, [id]: { ...item, mode: "inc", min: v } };
    });
  }
  function removeSel(id) {
    setSel((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
    // 핀돼 있으면 핀도 해제
    setPins((p) => {
      if (!p[tab].options[id]) return p;
      const opts = { ...p[tab].options };
      delete opts[id];
      return { ...p, [tab]: { ...p[tab], options: opts } };
    });
  }
  function flipMode(id) {
    setSel((prev) => ({
      ...prev,
      [id]: { ...prev[id], mode: prev[id].mode === "inc" ? "exc" : "inc" },
    }));
  }
  // 초기화: 핀된 것만 남기고 상황별 선택은 지움
  function clearAll() {
    setSel({ ...pins[tab].options });
    setPrice(pins.common.price ?? DEFAULT_PRICE);
    setCorrupt(pins.common.corrupt ?? "any");
    if (tab === "waystone") setTier(pins.waystone.tier ?? "");
  }

  // 패턴 생성 (게임 문법: 각 검색 세트를 " "로 감싸고 공백으로 구분)
  const pattern = useMemo(() => {
    const inc = [],
      exc = [];
    Object.values(sel).forEach((s) => {
      const p = piece(s.frag, s.min, s.text, {
        openMax: s.openMax,
        rmin: s.rmin,
        rmax: s.rmax,
        noPercent: s.noPercent,
      });
      if (s.mode === "inc") inc.push(p);
      else exc.push(p);
    });
    const sets = [];
    if (inc.length) {
      if (mode === "or") sets.push('"' + inc.join("|") + '"');
      else inc.forEach((p) => sets.push('"' + p + '"'));
    }
    exc.forEach((p) => sets.push('"!' + p + '"'));
    // 등급 (경로석 전용) · 타락 · 가격 = 독립 검색 세트로 AND 결합
    if (tab === "waystone") {
      const tp = tierPiece(tier);
      if (tp) sets.push('"' + tp + '"');
    }
    if (corrupt === "yes") sets.push('"타락"');
    else if (corrupt === "no") sets.push('"!타락"');
    const pp = pricePiece(price);
    if (pp) sets.push('"' + pp + '"');
    return sets.join(" ");
  }, [sel, mode, price, tier, corrupt, tab]);

  const selList = Object.entries(sel);
  const len = pattern.length;

  function copy() {
    navigator.clipboard?.writeText(pattern);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }
  function switchTab(t) {
    setTab(t);
    setSel({ ...pins[t].options }); // 새 탭의 핀된 옵션 복원
    setFilter("");
    if (t === "waystone") setTier(pins.waystone.tier ?? "");
  }

  return (
    <div className="min-h-full pb-16">
      {/* 헤더 */}
      <header className="border-b border-edge bg-bg0/60 backdrop-blur">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-4 px-[clamp(18px,4vw,40px)] py-4">
          <h1 className="font-cinzel text-[25px] font-bold tracking-[3px] text-gold-hi text-shadow-gold">
            PoE2 경로석·서판 검색기
          </h1>
          <div className="ml-auto flex gap-1 rounded-lg border border-edge bg-bg1 p-1">
            <button
              onClick={() => switchTab("tablet")}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
                tab === "tablet" ? "bg-gold/20 text-gold-hi" : "text-mute hover:text-ink"
              }`}
            >
              서판
            </button>
            <button
              onClick={() => switchTab("waystone")}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
                tab === "waystone" ? "bg-gold/20 text-gold-hi" : "text-mute hover:text-ink"
              }`}
            >
              경로석
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1080px] px-[clamp(18px,4vw,40px)]">
        {/* 서판 종류 */}
        {tab === "tablet" && (
          <div className="mt-6">
            <TabletTypeBar value={tabletType} onChange={setTabletType} />
          </div>
        )}

        {/* 결과 바 */}
        <ResultBar
          pattern={pattern}
          len={len}
          copied={copied}
          onCopy={copy}
          onClear={clearAll}
          selList={selList}
          onFlip={flipMode}
          onRemove={removeSel}
          onSetMin={setMin}
          pinnedOptions={pinnedOptions}
          onTogglePin={togglePinOption}
        />

        {/* 가격 필터 (경로석·서판 공통) */}
        <PriceFilter
          value={price}
          onChange={setPrice}
          pinned={pricePinned}
          onTogglePin={togglePinPrice}
        />

        {/* 등급(경로석)·타락 필터 */}
        <ExtraFilters
          tab={tab}
          tier={tier}
          onTier={setTier}
          corrupt={corrupt}
          onCorrupt={setCorrupt}
          tierPinned={tierPinned}
          onTogglePinTier={togglePinTier}
          corruptPinned={corruptPinned}
          onTogglePinCorrupt={togglePinCorrupt}
        />

        {/* 포함 결합 모드 + 필터 */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-lg border border-edge bg-bg1 p-1">
            <button
              onClick={() => setMode("or")}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                mode === "or" ? "bg-gold/20 text-gold-hi" : "text-mute hover:text-ink"
              }`}
              title="선택 옵션 중 하나라도"
            >
              OR (아무거나)
            </button>
            <button
              onClick={() => setMode("and")}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                mode === "and" ? "bg-gold/20 text-gold-hi" : "text-mute hover:text-ink"
              }`}
              title="선택 옵션 모두"
            >
              AND (모두)
            </button>
          </div>
          <input
            placeholder="찾기"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="min-w-[220px] flex-1 rounded-[10px] border border-edge bg-bg1 px-4 py-3 text-[15px] text-ink outline-none transition focus:border-gold/60"
          />
          <label className="flex cursor-pointer select-none items-center gap-1.5 text-[13px] text-mute">
            <input
              type="checkbox"
              checked={showTrade}
              onChange={(e) => setShowTrade(e.target.checked)}
              className="accent-gold"
            />
            거래소명 보기
          </label>
        </div>

        {/* 옵션 목록 */}
        <main>
          {tab === "tablet" && pool.noUnique && (
            <div className="mb-[18px] rounded-lg border border-edge border-l-[3px] border-l-gold bg-[#150f08] px-4 py-[13px] text-sm text-mute">
              <b className="text-gold-hi">{tabletType} 서판</b>은 전용 고유 옵션이 없어요.
              아래 공통 옵션으로 검색하세요.
            </div>
          )}
          {pool.groups.map((g, gi) => {
            const items = filter
              ? g.items.filter((it) => it.text.includes(filter))
              : g.items;
            if (!items.length) return null;
            return (
              <div key={g.title} className="mb-[34px]">
                <div className="mb-3.5 flex items-center gap-3 px-0.5">
                  <span className="font-cinzel text-[15px] uppercase tracking-[2px] text-gold">
                    {g.title}
                  </span>
                  <span className="rounded-full border border-edge px-2 py-0.5 text-[11px] text-mute">
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-col gap-[9px]">
                  {items.map((it, i) => (
                    <OptionRow
                      key={optId(it.text)}
                      item={it}
                      sel={sel[optId(it.text)]}
                      showTrade={showTrade}
                      onToggle={toggle}
                      onSetMin={setOptMin}
                      delay={mounted ? gi * 60 + i * 22 : 0}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </main>

        <footer className="mt-10 border-t border-edge pt-[18px] text-center text-xs leading-[1.8] text-mute">
          데이터 출처 <b className="text-mute">poe2db.tw/kr</b> · 검색 문법: 공백=AND ·{" "}
          <b>|</b>=OR · <b>!</b>=제외 · <b>.</b>=아무 글자 · 최대 250자
        </footer>
      </div>
    </div>
  );
}
