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
import Segmented from "./components/Segmented.jsx";
import NavRail from "./components/NavRail.jsx";
import RightPanel from "./components/RightPanel.jsx";
import ContactDialog from "./components/ContactDialog.jsx";
import { IconMenu, IconStar } from "./components/icons.jsx";
import { useMediaQuery } from "./hooks/useMediaQuery.js";

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
  // 셸 레이아웃 상태
  const [navOpen, setNavOpen] = useState(false); // 좁은 화면 드로어
  const [navCollapsed, setNavCollapsed] = useState(false); // 넓은 화면 수동 접기
  const [rightOpen, setRightOpen] = useState(true); // 우측 즐겨찾기 패널
  const [contactOpen, setContactOpen] = useState(false);

  // 반응형: lg(1024) 미만 → 좌측 드로어, xl(1280) 미만 → 레일 강제 아이콘화
  const isMidUp = useMediaQuery("(min-width: 1024px)");
  const isWide = useMediaQuery("(min-width: 1280px)");
  const overlayNav = !isMidUp;
  const railCollapsed = isWide ? navCollapsed : true;

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

  // 옵션 클릭 순환: 없음 → 포함 → 제외 → 제거(고정도 해제)
  function toggle(item) {
    const id = optId(item.text);
    const cur = sel[id];
    if (!cur) {
      setSel((prev) => ({ ...prev, [id]: { ...item, mode: "inc", min: "" } }));
    } else if (cur.mode === "inc") {
      setSel((prev) => ({ ...prev, [id]: { ...prev[id], mode: "exc" } }));
    } else {
      removeSel(id); // 제거 + 고정 해제 (removeSel이 핀도 정리)
    }
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
    <div className="flex h-full">
      {/* 좌측 내비게이션 */}
      <NavRail
        tab={tab}
        onTab={switchTab}
        onContact={() => setContactOpen(true)}
        overlay={overlayNav}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        collapsed={railCollapsed}
        showCollapseToggle={isWide}
        onToggleCollapse={() => setNavCollapsed((c) => !c)}
      />

      {/* 중앙 + 우측 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 상단 바 (도트 애니 헤더는 추후) */}
        <header className="flex items-center gap-3 border-b border-outline-variant bg-surface-c-low/70 px-4 py-3 backdrop-blur">
          {overlayNav && (
            <button
              onClick={() => setNavOpen(true)}
              className="rounded-full p-2 text-on-surface-variant transition hover:bg-surface-c-high"
              title="메뉴 열기"
            >
              <IconMenu width={22} height={22} />
            </button>
          )}
          <h1 className="font-cinzel text-title-l font-bold tracking-wide text-primary">
            경로석·서판 검색기
          </h1>
          {isWide && (
            <button
              onClick={() => setRightOpen((o) => !o)}
              title={rightOpen ? "즐겨찾기 숨기기" : "즐겨찾기 보기"}
              className={`ml-auto rounded-full p-2 transition hover:bg-surface-c-high ${
                rightOpen ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              <IconStar width={22} height={22} />
            </button>
          )}
        </header>

        <div className="flex min-h-0 flex-1">
          {/* 중앙 컨텐츠 (스크롤 영역) */}
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1080px] px-[clamp(18px,4vw,40px)] pb-16">
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
                <Segmented
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: "or", label: "OR (아무거나)", title: "선택 옵션 중 하나라도" },
                    { value: "and", label: "AND (모두)", title: "선택 옵션 모두" },
                  ]}
                />
                <input
                  placeholder="찾기"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="min-w-[220px] flex-1 rounded-md-s border border-outline bg-surface-c px-4 py-2.5 text-body-l text-on-surface outline-none transition focus:border-primary placeholder:text-on-surface-variant/60"
                />
                <label className="flex cursor-pointer select-none items-center gap-1.5 text-body-m text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={showTrade}
                    onChange={(e) => setShowTrade(e.target.checked)}
                    className="accent-primary"
                  />
                  거래소명 보기
                </label>
              </div>

              {/* 옵션 목록 */}
              <section>
                {tab === "tablet" && pool.noUnique && (
                  <div className="mb-[18px] rounded-md-s border border-outline-variant border-l-4 border-l-primary bg-surface-c px-4 py-3 text-body-m text-on-surface-variant">
                    <b className="text-primary">{tabletType} 서판</b>은 전용 고유 옵션이 없어요.
                    아래 공통 옵션으로 검색하세요.
                  </div>
                )}
                {pool.groups.map((g) => {
                  const items = filter
                    ? g.items.filter((it) => it.text.includes(filter))
                    : g.items;
                  if (!items.length) return null;
                  return (
                    <div key={g.title} className="mb-8">
                      <div className="mb-3.5 flex items-center gap-3 px-0.5">
                        <span className="font-cinzel text-label-l uppercase tracking-[2px] text-primary">
                          {g.title}
                        </span>
                        <span className="rounded-full border border-outline-variant px-2 py-0.5 text-label-s text-on-surface-variant">
                          {items.length}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {items.map((it) => (
                          <OptionRow
                            key={optId(it.text)}
                            item={it}
                            sel={sel[optId(it.text)]}
                            showTrade={showTrade}
                            onToggle={toggle}
                            onSetMin={setOptMin}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </section>

              <footer className="mt-10 border-t border-outline-variant pt-[18px] text-center text-body-s leading-[1.8] text-on-surface-variant">
                데이터 출처 <b className="text-on-surface">poe2db.tw/kr</b> · 검색 문법: 공백=AND ·{" "}
                <b>|</b>=OR · <b>!</b>=제외 · <b>.</b>=아무 글자 · 최대 250자
              </footer>
            </div>
          </main>

          {/* 우측 즐겨찾기 (xl+, 토글 가능) */}
          {rightOpen && <RightPanel />}
        </div>
      </div>

      {contactOpen && <ContactDialog onClose={() => setContactOpen(false)} />}
    </div>
  );
}
