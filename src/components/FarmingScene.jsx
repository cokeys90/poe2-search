import { useState } from "react";

// 헤더용 도트 애니메이션: 필멸자가 걸어가며 길에 놓인 화폐를 줍는다.
// 화폐는 가중 랜덤 — 디바인 90% / 히네코라의 자물쇠 9% / 미러 1%.
// 이동·수집 타이밍은 CSS 키프레임(9s 루프), 어떤 화폐인지는 매 루프 JS로 추첨.

// 실물 이미지 교체 지점: 각 항목에 img(경로/데이터URI) 추가하면 <img>로 렌더된다.
const CURRENCIES = {
  divine: {
    bg: "radial-gradient(circle at 35% 30%, #fff4d6, #e8c36b 55%, #b78a3a)",
    glow: "0 0 6px rgba(232,195,107,.55)",
  },
  hinekora: {
    bg: "radial-gradient(circle at 35% 30%, #8fe6d6, #2a7a6d 55%, #0e2b27)",
    glow: "0 0 7px rgba(127,216,198,.6)",
  },
  mirror: {
    bg: "radial-gradient(circle at 35% 30%, #ffffff, #d3dbe6 50%, #8a97a8)",
    glow: "0 0 11px rgba(220,230,245,.9)",
  },
};

function pickCurrency() {
  const r = Math.random() * 100; // 앱 런타임이라 사용 OK
  return r < 90 ? "divine" : r < 99 ? "hinekora" : "mirror";
}

function Orb({ slot }) {
  const [cur, setCur] = useState(pickCurrency);
  const c = CURRENCIES[cur];
  return (
    <span
      className={`fh-orb fh-orb${slot}`}
      onAnimationIteration={() => setCur(pickCurrency())}
      style={c.img ? undefined : { background: c.bg, boxShadow: c.glow }}
    >
      {c.img && <img className="fh-orb-img" src={c.img} alt="" />}
    </span>
  );
}

const CSS = `
.fh-scene { position: relative; height: 100%; overflow: hidden; }
.fh-ground {
  position: absolute; left: 0; right: 0; bottom: 12px; height: 0;
  border-top: 1px dotted rgb(var(--md-outline-variant));
}
/* 캐릭터 */
.fh-walker { position: absolute; bottom: 12px; animation: fh-walk 9s linear infinite; }
.fh-bob { animation: fh-bob 0.44s ease-in-out infinite; }
.fh-hero { display: block; height: 30px; width: auto; shape-rendering: crispEdges; }
.fh-legA { animation: fh-legA 0.44s steps(1) infinite; }
.fh-legB { animation: fh-legB 0.44s steps(1) infinite; }
@keyframes fh-walk { from { left: -8%; } to { left: 108%; } }
@keyframes fh-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.5px); } }
@keyframes fh-legA { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes fh-legB { 0%, 49% { opacity: 0; } 50%, 100% { opacity: 1; } }
/* 화폐 */
.fh-orb {
  position: absolute; bottom: 11px; width: 12px; height: 12px; border-radius: 9999px;
  display: inline-flex; align-items: center; justify-content: center;
}
.fh-orb-img { width: 150%; height: 150%; object-fit: contain; image-rendering: pixelated; }
.fh-orb1 { left: 30%; animation: fh-orb1 9s linear infinite; }
.fh-orb2 { left: 55%; animation: fh-orb2 9s linear infinite; }
.fh-orb3 { left: 80%; animation: fh-orb3 9s linear infinite; }
@keyframes fh-orb1 {
  0% { opacity: 0; transform: scale(0); }
  3%, 30% { opacity: 1; transform: translateY(0) scale(1); }
  33% { opacity: 0; transform: translateY(-13px) scale(1.9); }
  34%, 100% { opacity: 0; transform: scale(0); }
}
@keyframes fh-orb2 {
  0%, 24% { opacity: 0; transform: scale(0); }
  27%, 51% { opacity: 1; transform: translateY(0) scale(1); }
  54% { opacity: 0; transform: translateY(-13px) scale(1.9); }
  55%, 100% { opacity: 0; transform: scale(0); }
}
@keyframes fh-orb3 {
  0%, 46% { opacity: 0; transform: scale(0); }
  49%, 73% { opacity: 1; transform: translateY(0) scale(1); }
  76% { opacity: 0; transform: translateY(-13px) scale(1.9); }
  77%, 100% { opacity: 0; transform: scale(0); }
}
@media (prefers-reduced-motion: reduce) {
  .fh-walker, .fh-bob, .fh-legA, .fh-legB, .fh-orb { animation: none; }
  .fh-orb { opacity: 1; transform: none; }
  .fh-walker { left: 6%; }
  .fh-legB { opacity: 0; }
}
`;

// 픽셀 필멸자 (10x13 그리드, 오른쪽 바라봄)
function Hero() {
  const gold = "#e8c36b";
  const skin = "#e0bd93";
  const armor = "#3a352b";
  const armorHi = "#4a4437";
  const cape = "#a85a41";
  const dark = "#14120c";
  return (
    <svg className="fh-hero" viewBox="0 0 10 13" aria-hidden="true">
      <rect x="1" y="4" width="1" height="5" fill={cape} />
      <rect x="3" y="0" width="4" height="1" fill={gold} />
      <rect x="2" y="1" width="6" height="1" fill={gold} />
      <rect x="3" y="2" width="4" height="2" fill={skin} />
      <rect x="2" y="2" width="1" height="1" fill={gold} />
      <rect x="7" y="2" width="1" height="1" fill={gold} />
      <rect x="5" y="2" width="1" height="1" fill={dark} />
      <rect x="2" y="4" width="5" height="1" fill={armorHi} />
      <rect x="6" y="4" width="1" height="1" fill={gold} />
      <rect x="2" y="5" width="5" height="2" fill={armor} />
      <rect x="2" y="7" width="5" height="1" fill={gold} />
      <rect x="2" y="8" width="5" height="1" fill={armor} />
      <rect x="6" y="5" width="1" height="3" fill={skin} />
      <g className="fh-legA">
        <rect x="5" y="9" width="1" height="2" fill={dark} />
        <rect x="5" y="11" width="2" height="1" fill={gold} />
        <rect x="3" y="9" width="1" height="2" fill={dark} />
        <rect x="2" y="11" width="2" height="1" fill={gold} />
      </g>
      <g className="fh-legB">
        <rect x="4" y="9" width="2" height="2" fill={dark} />
        <rect x="4" y="11" width="2" height="1" fill={gold} />
      </g>
    </svg>
  );
}

export default function FarmingScene() {
  return (
    <div className="fh-scene" aria-hidden="true">
      <style>{CSS}</style>
      <div className="fh-ground" />
      <Orb slot={1} />
      <Orb slot={2} />
      <Orb slot={3} />
      <div className="fh-walker">
        <div className="fh-bob">
          <Hero />
        </div>
      </div>
    </div>
  );
}
