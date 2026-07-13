import { useState, useEffect, useMemo, useRef } from "react";
import { DATA, DEFAULT_TABLET_TYPE, DEFAULT_TIER } from "./data/options.js";
import { piece, pricePiece, tierPiece } from "./lib/regex.js";
import {
  tradeUrl,
  queryToState,
  readHashQuery,
  fetchStatNames,
  DEFAULT_LEAGUE,
} from "./lib/trade.js";
import TradeImportDialog from "./components/TradeImportDialog.jsx";
import { optId, useOptionPool } from "./lib/options.js";
import {
  loadPins,
  savePins,
  loadCurrency,
  saveCurrency,
  loadLeague,
  saveLeague,
  FAV_WIN_KEY,
  SETTINGS_WIN_KEY,
} from "./lib/storage.js";
import TabletTypeBar from "./components/TabletTypeBar.jsx";
import OptionGroup from "./components/OptionGroup.jsx";
import ResultBar from "./components/ResultBar.jsx";
import PriceFilter from "./components/PriceFilter.jsx";
import { CorruptFilter, TierGrid } from "./components/ExtraFilters.jsx";
import Segmented from "./components/Segmented.jsx";
import ScrollFab from "./components/ScrollFab.jsx";
import FarmingScene from "./components/FarmingScene.jsx";
import NavRail from "./components/NavRail.jsx";
import FavoritesWindow from "./components/FavoritesWindow.jsx";
import SettingsWindow from "./components/SettingsWindow.jsx";
import Callout from "./components/Callout.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import CreditsDialog from "./components/CreditsDialog.jsx";
import {
  IconMenu,
  IconStar,
  IconSettings,
  IconLightMode,
  IconDarkMode,
} from "./components/icons.jsx";
import { useMediaQuery } from "./hooks/useMediaQuery.js";
import { useFavorites } from "./hooks/useFavorites.js";
import { useFloatingWindow } from "./hooks/useFloatingWindow.js";
import { useOptionPrefs } from "./hooks/useOptionPrefs.js";
import { useTheme } from "./hooks/useTheme.js";

const DEFAULT_PRICE = {
  enabled: false,
  mode: "exact",
  min: "",
  max: "",
  currency: "exalted",
};
const INITIAL_TAB = "tablet";

// 탭 전환·초기화 시의 가격 기본값. 핀돼 있으면 핀 값(화폐 포함)이 우선,
// 아니면 그 탭에서 마지막에 고른 화폐를 유지한다.
function basePrice(pins, lastCurrency, t) {
  if (pins.common.price != null) return pins.common.price;
  return { ...DEFAULT_PRICE, currency: lastCurrency[t] };
}

export default function App() {
  const [pins, setPins] = useState(loadPins); // 고정된 설정 (localStorage)
  const [tab, setTab] = useState(INITIAL_TAB);
  const [tabletType, setTabletType] = useState(DEFAULT_TABLET_TYPE);
  // 초기값을 핀에서 복원
  const [sel, setSel] = useState(() => ({ ...pins[INITIAL_TAB].options }));
  const [mode, setMode] = useState("or");
  const [lastCurrency, setLastCurrency] = useState(loadCurrency); // 탭별 마지막 화폐
  const [price, setPrice] = useState(() =>
    pins.common.price ?? { ...DEFAULT_PRICE, currency: loadCurrency()[INITIAL_TAB] }
  );
  const [tier, setTier] = useState(() => pins.waystone.tier ?? DEFAULT_TIER); // 경로석 등급 (""=무관)
  const [corrupt, setCorrupt] = useState(() => pins.common.corrupt ?? "any"); // any | yes | no
  const [filter, setFilter] = useState("");
  const [showTrade, setShowTrade] = useState(false); // 거래소명 표시 = 개발 빌드에서만 켤 수 있다
  const [copied, setCopied] = useState(false);
  // 셸 레이아웃 상태
  const [navOpen, setNavOpen] = useState(false); // 좁은 화면 드로어
  const [navCollapsed, setNavCollapsed] = useState(false); // 넓은 화면 수동 접기
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [pendingLoad, setPendingLoad] = useState(null); // 즐겨찾기 덮어쓰기 확인 대기
  const { theme, toggle: toggleTheme } = useTheme();

  // 반응형: lg(1024) 미만 → 좌측 드로어, xl(1280) 미만 → 레일 강제 아이콘화
  const isMidUp = useMediaQuery("(min-width: 1024px)");
  const isWide = useMediaQuery("(min-width: 1280px)");
  const overlayNav = !isMidUp;
  const railCollapsed = isWide ? navCollapsed : true;
  const mainRef = useRef(null); // 중앙 스크롤 컨테이너 (FAB 점프용)

  // 플로팅 창들 (위치·크기·표시모드는 localStorage에 영속)
  const favWin = useFloatingWindow(FAV_WIN_KEY);
  const settingsWin = useFloatingWindow(SETTINGS_WIN_KEY);
  // 좁은 화면(<640px)에선 드래그 가능한 창이 쓸모없으므로 전체화면 시트로
  const winFullscreen = !useMediaQuery("(min-width: 640px)");

  // 옵션 목록 개인화 (그룹 내 순서·숨김)
  const optPrefs = useOptionPrefs();

  // 거래소 링크에 쓸 리그
  const [league, setLeagueState] = useState(() => loadLeague(DEFAULT_LEAGUE));
  function setLeague(id) {
    setLeagueState(id);
    saveLeague(id);
  }

  const pool = useOptionPool(tab, tabletType);

  // pins 변경 시 localStorage 저장
  useEffect(() => {
    savePins(pins);
  }, [pins]);

  // 화폐를 바꾸면 현재 탭의 "마지막 화폐"로 기억
  useEffect(() => {
    setLastCurrency((c) => (c[tab] === price.currency ? c : { ...c, [tab]: price.currency }));
  }, [price.currency, tab]);
  useEffect(() => {
    saveCurrency(lastCurrency);
  }, [lastCurrency]);

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
    setPrice(basePrice(pins, lastCurrency, tab));
    setCorrupt(pins.common.corrupt ?? "any");
    if (tab === "waystone") setTier(pins.waystone.tier ?? DEFAULT_TIER);
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
    // 서판/경로석은 독립 — 상황별 가격·타락 필터는 넘기지 않고 초기화(핀·탭별 화폐만 유지)
    setPrice(basePrice(pins, lastCurrency, t));
    setCorrupt(pins.common.corrupt ?? "any");
    setFilter("");
    if (t === "waystone") setTier(pins.waystone.tier ?? DEFAULT_TIER);
  }

  // ── 즐겨찾기 ──
  const selCount = selList.length;
  const defaultFavName =
    (tab === "tablet" ? `${tabletType} 서판` : "경로석") +
    (selCount > 0 ? ` · ${selCount}옵션` : " · 필터");

  function snapshot() {
    const s = { tab, sel, mode, price, corrupt, pattern };
    if (tab === "tablet") s.tabletType = tabletType;
    if (tab === "waystone") s.tier = tier;
    return s;
  }

  // 즐겨찾기 컬렉션(그룹/항목 CRUD·드래그)은 훅으로 분리. 스냅샷·기본이름만 주입.
  const favs = useFavorites({ makeSnapshot: snapshot, makeName: () => defaultFavName });

  function applyFavorite(fav) {
    setTab(fav.tab);
    if (fav.tab === "tablet") setTabletType(fav.tabletType || tabletType);
    setSel({ ...fav.sel });
    setMode(fav.mode ?? "or");
    setPrice(fav.price ?? DEFAULT_PRICE);
    setCorrupt(fav.corrupt ?? "any");
    setTier(fav.tab === "waystone" ? fav.tier ?? "" : "");
    setFilter("");
    setPendingLoad(null);
  }

  function requestLoadFavorite(fav) {
    if (selList.length > 0) setPendingLoad(fav); // 현재 선택 있으면 확인
    else applyFavorite(fav);
  }

  // 거래소 — 검색 조건을 ?q=로 실어 새 탭으로 연다 (현재 검색 / 즐겨찾기 스냅샷 공용)
  const currentTrade = useMemo(
    () => tradeUrl({ tab, tabletType, sel, mode, price, corrupt, tier, league }),
    [tab, tabletType, sel, mode, price, corrupt, tier, league]
  );
  function openTrade(snap) {
    const { url } = tradeUrl({ ...snap, league });
    window.open(url, "_blank", "noopener");
  }

  // 거래소 → 우리 앱. 못 옮긴 조건은 배너로 알린다.
  const [importOpen, setImportOpen] = useState(false);
  const [importSkipped, setImportSkipped] = useState([]);

  // 북마클릿이 넘겨준 조건(#trade=…)을 첫 렌더에 적용
  useEffect(() => {
    const q = readHashQuery();
    if (!q) return;
    history.replaceState(null, "", location.pathname); // 주소는 깔끔하게 되돌린다
    const { state, skipped } = queryToState(q);
    applyImport(state, skipped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyImport(s, skipped) {
    // 못 가져온 옵션은 stat id뿐이라 이름을 따로 조회해 보여준다
    fetchStatNames(skipped).then(setImportSkipped);
    setTab(s.tab);
    if (s.tab === "tablet" && s.tabletType) setTabletType(s.tabletType);
    setSel(s.sel);
    setMode(s.mode);
    setPrice(s.price);
    setCorrupt(s.corrupt);
    setTier(s.tab === "waystone" ? s.tier : "");
    setFilter("");
    setImportSkipped(skipped);
    setImportOpen(false);
  }

  return (
    <div className="flex h-full">
      {/* 좌측 내비게이션 */}
      <NavRail
        tab={tab}
        onTab={switchTab}
        onCredits={() => setCreditsOpen(true)}
        overlay={overlayNav}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        collapsed={railCollapsed}
        showCollapseToggle={isWide}
        onToggleCollapse={() => setNavCollapsed((c) => !c)}
      />

      {/* 중앙 + 우측 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 상단 바 — 도트 애니(파밍 가는 필멸자 + 디바인 줍줍) */}
        <header className="flex h-16 items-center gap-3 border-b border-outline-variant bg-surface-c-low/70 px-4 backdrop-blur">
          {overlayNav && (
            <button
              onClick={() => setNavOpen(true)}
              className="rounded-full p-2 text-on-surface-variant transition hover:bg-surface-c-high"
              title="메뉴 열기"
            >
              <IconMenu width={22} height={22} />
            </button>
          )}
          <div className="relative h-full flex-1">
            <FarmingScene />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "라이트 모드로" : "다크 모드로"}
              className="rounded-full p-2 text-on-surface-variant transition hover:bg-surface-c-high"
            >
              {theme === "dark" ? <IconLightMode width={22} /> : <IconDarkMode width={22} />}
            </button>
            <button
              onClick={favWin.toggleOpen}
              title={favWin.open ? "즐겨찾기 닫기" : "즐겨찾기 열기"}
              className={`rounded-full p-2 transition hover:bg-surface-c-high ${
                favWin.open ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              <IconStar width={22} height={22} />
            </button>
            <button
              onClick={settingsWin.toggleOpen}
              title={settingsWin.open ? "설정 닫기" : "설정 열기"}
              className={`rounded-full p-2 transition hover:bg-surface-c-high ${
                settingsWin.open ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              <IconSettings width={22} height={22} />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* 중앙 컨텐츠 (스크롤 영역) */}
          <main ref={mainRef} className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1080px] px-[clamp(18px,4vw,40px)] pb-16">
              {/* 검색엔진용 제목 — 화면에는 보이지 않는다 */}
              <h1 className="sr-only">
                PoE2 경로석·서판 검색기 — 옵션을 고르면 인게임 검색용 정규식이 만들어집니다
              </h1>

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
                onTrade={() => openTrade(snapshot())}
                tradeSkipped={currentTrade.skipped}
                onTradeImport={() => setImportOpen(true)}
              />

              {importSkipped.length > 0 && (
                <Callout>
                  <span className="block">
                    거래소 조건 중{" "}
                    <b className="text-primary">{importSkipped.length}개</b>는 이 앱에 없는 옵션이라
                    못 가져왔어요.
                  </span>
                  <ul className="mt-1 list-disc pl-4 text-body-s text-on-surface-variant">
                    {importSkipped.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </Callout>
              )}

              {/* 필터 카드 — 좌: 가격·타락·결합모드·찾기 / 우: 등급 격자(경로석) */}
              <section className="mb-4 flex flex-wrap gap-x-6 gap-y-4 rounded-md-m border border-outline-variant bg-surface-c px-4 py-3">
                <div className="flex min-w-[300px] flex-1 flex-col gap-3">
                  <PriceFilter
                    value={price}
                    onChange={setPrice}
                    pinned={pricePinned}
                    onTogglePin={togglePinPrice}
                  />

                  <CorruptFilter
                    corrupt={corrupt}
                    onCorrupt={setCorrupt}
                    pinned={corruptPinned}
                    onTogglePin={togglePinCorrupt}
                  />

                  <div className="flex items-center gap-2">
                    <span className="w-12 shrink-0 text-label-l text-on-surface">결합</span>
                    <Segmented
                      value={mode}
                      onChange={setMode}
                      options={[
                        { value: "or", label: "OR (아무거나)", title: "선택 옵션 중 하나라도" },
                        { value: "and", label: "AND (모두)", title: "선택 옵션 모두" },
                      ]}
                    />
                  </div>

                </div>

                {tab === "waystone" && (
                  <TierGrid
                    tier={tier}
                    onTier={setTier}
                    pinned={tierPinned}
                    onTogglePin={togglePinTier}
                  />
                )}
              </section>

              {/* 서판 종류 (옵션 목록을 결정하는 입력 → 목록 바로 위에 배치) */}
              {tab === "tablet" && (
                <div className="mb-4">
                  <TabletTypeBar value={tabletType} onChange={setTabletType} />
                </div>
              )}

              {/* 옵션 목록 */}
              <section>
                {tab === "tablet" && pool.noUnique && (
                  <Callout>
                    <b className="text-primary">{tabletType} 서판</b>은 전용 고유 옵션이 없어요. 아래
                    공통 옵션으로 검색하세요.
                  </Callout>
                )}

                {/* 찾기 — 옵션 목록 전용 입력이라 필터 카드와 분리해 목록 바로 위에 둔다 */}
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <input
                    placeholder="옵션 찾기"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="min-w-[220px] flex-1 rounded-md-s border border-outline bg-surface-c px-4 py-2 text-body-l text-on-surface outline-none transition focus:border-primary placeholder:text-on-surface-variant/60"
                  />
                  {/* 개발 빌드 전용 — 배포본에는 아예 렌더되지 않는다 */}
                  {import.meta.env.DEV && (
                    <label className="flex cursor-pointer select-none items-center gap-1.5 rounded-md-s border border-dashed border-tertiary/60 px-2 py-1.5 text-body-m text-on-surface-variant">
                      <span className="rounded-md-xs bg-tertiary-container px-1.5 py-0.5 text-label-s text-on-tertiary-container">
                        dev
                      </span>
                      <input
                        type="checkbox"
                        checked={showTrade}
                        onChange={(e) => setShowTrade(e.target.checked)}
                        className="accent-primary"
                      />
                      거래소명 보기
                    </label>
                  )}
                </div>

                {(() => {
                  const render = (g) => {
                    const key = `${tab}:${g.title}`;
                    const { items, hidden } = optPrefs.applyTo(key, g.items);
                    return (
                      <OptionGroup
                        key={g.title}
                        title={g.title}
                        items={items}
                        hidden={hidden}
                        filter={filter}
                        sel={sel}
                        showTrade={showTrade}
                        onToggle={toggle}
                        onSetMin={setOptMin}
                        onReorder={(dragId, targetId) =>
                          optPrefs.reorder(key, g.items, dragId, targetId)
                        }
                        onHide={(id) => optPrefs.hide(key, g.items, id)}
                        onUnhide={(id) => optPrefs.unhide(key, id)}
                      />
                    );
                  };
                  // poe2db 배치: 경로석의 "옵션"(상단 6종)은 단독 전폭,
                  // 접두어는 왼쪽 열 / 접미어(공통·고유)는 오른쪽 열에 세로로 쌓는다.
                  const solo = pool.groups.filter((g) => g.title === "옵션");
                  const rest = pool.groups.filter((g) => g.title !== "옵션");
                  const left = rest.filter((g) => g.title.includes("접두어"));
                  const right = rest.filter((g) => !g.title.includes("접두어"));
                  return (
                    <>
                      {solo.map(render)}
                      <div className="grid items-start gap-x-5 xl:grid-cols-2">
                        <div>{left.map(render)}</div>
                        <div>{right.map(render)}</div>
                      </div>
                    </>
                  );
                })()}
              </section>

              <footer className="mt-10 border-t border-outline-variant pt-[18px] text-center text-body-s leading-[1.8] text-on-surface-variant">
                데이터 출처 <b className="text-on-surface">poe2db.tw/kr</b> · 검색 문법: 공백=AND ·{" "}
                <b>|</b>=OR · <b>!</b>=제외 · <b>.</b>=아무 글자 · 최대 250자
              </footer>
            </div>
          </main>

        </div>
      </div>

      {/* 스크롤 점프 FAB (최상단/접두어/접미어) — 창은 레이아웃을 밀지 않으므로 여백 고정 */}
      <ScrollFab scrollRef={mainRef} rightInset={24} />

      {/* 즐겨찾기 플로팅 창 (non-modal — 띄운 채로 옵션을 고르고 저장) */}
      {favWin.open && (
        <FavoritesWindow
          geom={favWin.geom}
          onGeom={favWin.setGeom}
          fullscreen={winFullscreen}
          view={favWin.view}
          onView={favWin.setView}
          onClose={favWin.close}
          groups={favs.groups}
          autoEditFavId={favs.autoEditFavId}
          autoEditGroupId={favs.autoEditGroupId}
          onAddToGroup={favs.addToGroup}
          onLoad={requestLoadFavorite}
          onRenameFav={favs.renameFav}
          onDeleteFav={favs.deleteFav}
          onOverwriteFav={favs.overwriteFav}
          onTradeFav={openTrade}
          onCreateGroup={favs.createGroup}
          onRenameGroup={favs.renameGroup}
          onDeleteGroup={favs.requestDeleteGroup}
          onMoveFav={favs.moveFav}
        />
      )}

      {/* 설정 창 (즐겨찾기와 같은 플로팅 셸) */}
      {settingsWin.open && (
        <SettingsWindow
          geom={settingsWin.geom}
          onGeom={settingsWin.setGeom}
          fullscreen={winFullscreen}
          onClose={settingsWin.close}
          onResetFavWindow={favWin.resetGeom}
          onResetOptPrefs={optPrefs.reset}
          optPrefsDirty={optPrefs.hasPrefs}
          league={league}
          onLeague={setLeague}
        />
      )}

      {importOpen && (
        <TradeImportDialog onClose={() => setImportOpen(false)} />
      )}

      {creditsOpen && <CreditsDialog onClose={() => setCreditsOpen(false)} />}

      {pendingLoad && (
        <ConfirmDialog
          title="즐겨찾기 불러오기"
          message="현재 선택을 덮어쓰고 불러올까요?"
          confirmLabel="불러오기"
          onConfirm={() => applyFavorite(pendingLoad)}
          onCancel={() => setPendingLoad(null)}
        />
      )}

      {favs.pendingGroupDelete && (
        <ConfirmDialog
          title="그룹 삭제"
          message={`'${favs.pendingGroupDelete.name}' 그룹과 안의 즐겨찾기 ${favs.pendingGroupDelete.items.length}개를 삭제할까요?`}
          confirmLabel="삭제"
          onConfirm={() => favs.deleteGroup(favs.pendingGroupDelete.id)}
          onCancel={() => favs.setPendingGroupDelete(null)}
        />
      )}
    </div>
  );
}
