// 헤더용 도트 애니메이션: 필멸자가 걸어가며 길에 놓인 디바인 오브를 줍는다.
// CSS 키프레임 하나(9s 루프)로 캐릭터 이동과 오브 수집 타이밍을 동기화한다.
// 캐릭터 left: -8% → 108% (span 116). p% 위치 도달 시각 = (p+8)/116.
//  오브 30% → 33% 시점, 55% → 54%, 80% → 76% 에 수집.

const CSS = `
.fh-scene { position: relative; height: 100%; overflow: hidden; }
.fh-ground {
  position: absolute; left: 0; right: 0; bottom: 12px; height: 0;
  border-top: 1px dotted rgb(var(--md-outline-variant));
}
/* 캐릭터 */
.fh-walker {
  position: absolute; bottom: 12px;
  animation: fh-walk 9s linear infinite;
}
.fh-bob { animation: fh-bob 0.44s ease-in-out infinite; }
.fh-hero { display: block; height: 30px; width: auto; shape-rendering: crispEdges; }
.fh-legA { animation: fh-legA 0.44s steps(1) infinite; }
.fh-legB { animation: fh-legB 0.44s steps(1) infinite; }
@keyframes fh-walk { from { left: -8%; } to { left: 108%; } }
@keyframes fh-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.5px); } }
@keyframes fh-legA { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes fh-legB { 0%, 49% { opacity: 0; } 50%, 100% { opacity: 1; } }
/* 디바인 오브 */
.fh-orb {
  position: absolute; bottom: 11px; width: 11px; height: 11px; border-radius: 9999px;
  background: radial-gradient(circle at 35% 30%, #fff4d6, #e8c36b 55%, #b78a3a);
  box-shadow: 0 0 6px rgba(232, 195, 107, 0.55);
}
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
      {/* 망토 */}
      <rect x="1" y="4" width="1" height="5" fill={cape} />
      {/* 투구 */}
      <rect x="3" y="0" width="4" height="1" fill={gold} />
      <rect x="2" y="1" width="6" height="1" fill={gold} />
      {/* 얼굴 */}
      <rect x="3" y="2" width="4" height="2" fill={skin} />
      <rect x="2" y="2" width="1" height="1" fill={gold} />
      <rect x="7" y="2" width="1" height="1" fill={gold} />
      <rect x="5" y="2" width="1" height="1" fill={dark} />
      {/* 몸통 */}
      <rect x="2" y="4" width="5" height="1" fill={armorHi} />
      <rect x="6" y="4" width="1" height="1" fill={gold} />
      <rect x="2" y="5" width="5" height="2" fill={armor} />
      <rect x="2" y="7" width="5" height="1" fill={gold} />
      <rect x="2" y="8" width="5" height="1" fill={armor} />
      {/* 팔 */}
      <rect x="6" y="5" width="1" height="3" fill={skin} />
      {/* 다리 프레임 A (벌림) */}
      <g className="fh-legA">
        <rect x="5" y="9" width="1" height="2" fill={dark} />
        <rect x="5" y="11" width="2" height="1" fill={gold} />
        <rect x="3" y="9" width="1" height="2" fill={dark} />
        <rect x="2" y="11" width="2" height="1" fill={gold} />
      </g>
      {/* 다리 프레임 B (모음) */}
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
      <span className="fh-orb fh-orb1" />
      <span className="fh-orb fh-orb2" />
      <span className="fh-orb fh-orb3" />
      <div className="fh-walker">
        <div className="fh-bob">
          <Hero />
        </div>
      </div>
    </div>
  );
}
