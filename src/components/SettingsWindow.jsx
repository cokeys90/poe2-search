import FloatingWindow from "./FloatingWindow.jsx";
import Tooltip from "./Tooltip.jsx";
import { IconSettings, IconClose, IconReset } from "./icons.jsx";
import { TRADE_SITES, tradeSite, siteForLang } from "../lib/trade.js";
import { t } from "../i18n/index.js";

// 언어 이름은 그 언어로 적는다 — 못 읽는 언어로 적혀 있으면 되돌아올 수가 없다.
const LANG_LABELS = [
  ["kr", "한국어"],
  ["us", "English"],
  ["tw", "繁體中文"],
  ["jp", "日本語"],
  ["ru", "Русский"],
  ["pt", "Português"],
  ["th", "ภาษาไทย"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["sp", "Español"],
];

// 설정 항목 한 줄: 설명 + 실행 버튼
function Row({ title, desc, actionLabel, onAction, disabled }) {
  return (
    <div className="flex items-center gap-3 rounded-md-s border border-outline-variant bg-surface-c px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-label-l text-on-surface">{title}</p>
        <p className="text-body-s text-on-surface-variant">{desc}</p>
      </div>
      <button
        onClick={onAction}
        disabled={disabled}
        className="flex shrink-0 items-center gap-1 rounded-md-s bg-secondary-container px-3 py-1.5 text-label-m text-on-secondary-container transition hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
      >
        <IconReset width={16} />
        {actionLabel}
      </button>
    </div>
  );
}

// 설정 창 — 즐겨찾기 창과 같은 플로팅 셸(이동·리사이즈·위치 저장)을 쓴다.
export default function SettingsWindow({
  geom,
  onGeom,
  fullscreen,
  onClose,
  onResetFavWindow,
  onResetOptPrefs,
  optPrefsDirty,
  siteSetting,
  onSiteSetting,
  site,
  league,
  onLeague,
  lang,
  langs,
  onLang,
}) {
  const S = tradeSite(site);
  const header = (
    <div className="flex items-center gap-2 border-b border-outline-variant bg-surface-c-low px-3 py-2.5">
      <IconSettings width={20} className="shrink-0 text-primary" />
      <span className="mr-auto truncate text-title-s text-on-surface">{t("settings.title")}</span>
      <Tooltip label={t("favs.close")}>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-on-surface-variant transition hover:bg-surface-c-high hover:text-on-surface"
        >
          <IconClose width={20} />
        </button>
      </Tooltip>
    </div>
  );

  return (
    <FloatingWindow geom={geom} onCommit={onGeom} fullscreen={fullscreen} onClose={onClose} header={header}>
      <div className="flex flex-col gap-2 p-3">
        {/* 언어 — 게임 클라이언트의 언어와 맞춰야 인게임 검색어가 통한다 */}
        <div className="flex items-center gap-3 rounded-md-s border border-outline-variant bg-surface-c px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-label-l text-on-surface">{t("settings.lang")}</p>
            <p className="text-body-s text-on-surface-variant">
              {t("settings.langDesc")}
            </p>
          </div>
          <select
            value={lang}
            onChange={(e) => onLang(e.target.value)}
            className="shrink-0 rounded-md-s border border-outline bg-surface-c-lowest px-2 py-1.5 text-body-m text-on-surface outline-none transition focus:border-primary"
          >
            {LANG_LABELS.filter(([id]) => langs.includes(id)).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* 거래소 서버 — 언어와 별개 축이다(한국어를 쓰면서 글로벌에서 살 수도 있다) */}
        <div className="flex items-center gap-3 rounded-md-s border border-outline-variant bg-surface-c px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-label-l text-on-surface">{t("settings.site")}</p>
            <p className="text-body-s text-on-surface-variant">{t("settings.siteDesc")}</p>
          </div>
          <select
            value={siteSetting}
            onChange={(e) => onSiteSetting(e.target.value)}
            className="shrink-0 rounded-md-s border border-outline bg-surface-c-lowest px-2 py-1.5 text-body-m text-on-surface outline-none transition focus:border-primary"
          >
            <option value="auto">
              {t("settings.site.auto", { name: t("site." + siteForLang(lang)) })}
            </option>
            {Object.keys(TRADE_SITES).map((id) => (
              <option key={id} value={id}>
                {t("site." + id)}
              </option>
            ))}
          </select>
        </div>

        {/* 거래소 리그 — 리그 목록 API는 CORS가 없어 조회 불가라 직접 고른다. id가 거래소마다 다르다 */}
        <div className="flex items-center gap-3 rounded-md-s border border-outline-variant bg-surface-c px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-label-l text-on-surface">{t("settings.league")}</p>
            <p className="text-body-s text-on-surface-variant">
              {t("settings.leagueDesc")}
            </p>
          </div>
          <select
            value={league}
            onChange={(e) => onLeague(e.target.value)}
            className="shrink-0 rounded-md-s border border-outline bg-surface-c-lowest px-2 py-1.5 text-body-m text-on-surface outline-none transition focus:border-primary"
          >
            {S.leagues.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <Row
          title={t("settings.resetFavWin")}
          desc={t("settings.resetFavWinDesc")}
          actionLabel={t("settings.reset")}
          onAction={onResetFavWindow}
        />
        <Row
          title={t("settings.resetOptPrefs")}
          desc={t("settings.resetOptPrefsDesc")}
          actionLabel={t("settings.reset")}
          onAction={onResetOptPrefs}
          disabled={!optPrefsDirty}
        />
      </div>
    </FloatingWindow>
  );
}
