import { TABLET_META, DEFAULT_TABLET_TYPE, DEFAULT_TIER } from "../data/options.js";

// 게임 인벤토리 아이콘 (poe2wiki 원본, public/tablet · public/waystone).
// 서판은 종류별, 경로석은 등급(1~16)별로 그림이 다르다.

// type = 서판 종류 slug (= TABLET_META의 키이자 그림 파일명)
export function tabletIconSrc(type) {
  const slug = TABLET_META[type] ? type : DEFAULT_TABLET_TYPE;
  return `/tablet/${slug}.png`;
}

export function waystoneIconSrc(tier) {
  const t = Number(tier);
  return `/waystone/t${t >= 1 && t <= 16 ? t : DEFAULT_TIER}.png`; // 등급 무관 → 기본 등급 그림
}

export function TabletIcon({ type = DEFAULT_TABLET_TYPE, width = 22, className = "" }) {
  return (
    <img
      src={tabletIconSrc(type)}
      width={width}
      height={width}
      alt=""
      className={`shrink-0 object-contain brightness-110 contrast-[1.05] ${className}`}
    />
  );
}

export function WaystoneIcon({ tier = DEFAULT_TIER, width = 22, className = "" }) {
  return (
    <img
      src={waystoneIconSrc(tier)}
      width={width}
      height={width}
      alt=""
      className={`shrink-0 object-contain brightness-110 contrast-[1.05] ${className}`}
    />
  );
}
