import { useState, useEffect, useMemo } from "react";
import { DATA } from "./data/options.js";
import { piece, pricePiece } from "./lib/regex.js";
import { optId, useOptionPool } from "./lib/options.js";
import TabletTypeBar from "./components/TabletTypeBar.jsx";
import OptionRow from "./components/OptionRow.jsx";
import ResultBar from "./components/ResultBar.jsx";
import PriceFilter from "./components/PriceFilter.jsx";

export default function App() {
  const [tab, setTab] = useState("tablet");
  const [tabletType, setTabletType] = useState("탐험");
  const [sel, setSel] = useState({});
  const [mode, setMode] = useState("or");
  const [price, setPrice] = useState({
    enabled: false,
    mode: "exact",
    min: "",
    max: "",
    currency: "chaos",
  });
  const [filter, setFilter] = useState("");
  const [showTrade, setShowTrade] = useState(true);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pool = useOptionPool(tab, tabletType);

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
  }
  function flipMode(id) {
    setSel((prev) => ({
      ...prev,
      [id]: { ...prev[id], mode: prev[id].mode === "inc" ? "exc" : "inc" },
    }));
  }
  function clearAll() {
    setSel({});
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
    const pp = pricePiece(price);
    if (pp) sets.push('"' + pp + '"');
    return sets.join(" ");
  }, [sel, mode, price]);

  const selList = Object.entries(sel);
  const len = pattern.length;

  function copy() {
    navigator.clipboard?.writeText(pattern);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }
  function switchTab(t) {
    setTab(t);
    setSel({});
    setFilter("");
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
        />

        {/* 가격 필터 (경로석·서판 공통) */}
        <PriceFilter value={price} onChange={setPrice} />

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
