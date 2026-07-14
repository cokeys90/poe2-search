// 언어별 폰트 — Pretendard가 못 덮는 문자를 채운다.
//
// Pretendard는 라틴·한글·가나까지다. **키릴·태국어·한자는 없다** (v1.3.9 dynamic-subset의
// unicode-range로 확인). 그대로 두면 러시아어·태국어·일본어(한자)·번체가 시스템 기본 폰트로
// 떨어져 화면이 들쭉날쭉해진다.
//
// 폰트 폴백은 **글자 단위**다 → Pretendard를 앞에 두고 그 뒤에 언어 폰트를 놓으면
// 라틴·한글·가나는 Pretendard가, 나머지 글자만 언어 폰트가 그린다. (index.css의 --font-lang)
//
// CJK 폰트는 무겁다(수 MB) → 그 언어를 고를 때만 받는다. 구글 폰트는 unicode-range로 쪼개
// 보내므로 실제로 쓰는 구간만 내려온다.

// 굵기는 화면이 실제로 쓰는 것만 — 400(본문) · 500(M3의 title/label) · 700(<b>).
// 굵기 하나가 늘 때마다 subset 파일 수가 그만큼 곱해진다 (CJK는 구간이 100개 가까이 된다).
const W = "wght@400;500;700";
const FONTS = {
  ru: { family: "Noto Sans", css: `Noto+Sans:${W}` }, // 키릴
  th: { family: "Noto Sans Thai", css: `Noto+Sans+Thai:${W}` },
  jp: { family: "Noto Sans JP", css: `Noto+Sans+JP:${W}` }, // 한자 (가나는 Pretendard가 덮는다)
  tw: { family: "Noto Sans TC", css: `Noto+Sans+TC:${W}` },
};

// 라틴 문자 언어(us·pt·fr·de·sp)와 한국어는 Pretendard로 충분하다 → 아무것도 안 받는다.
export function applyFont(lang) {
  const f = FONTS[lang];
  const root = document.documentElement;

  if (!f) {
    root.style.removeProperty("--font-lang");
    return;
  }

  const id = `font-${lang}`;
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${f.css}&display=swap`;
    document.head.appendChild(link);
  }
  root.style.setProperty("--font-lang", `"${f.family}"`);
}
