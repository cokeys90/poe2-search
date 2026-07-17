// 로케일의 기본 타입명(bases)에서 아이템 이름을 뽑는다.
//
//   "균열 서판" / "방사능 노출 서판"  → 공통 부분이 "서판"
//   "경로석 (15등급)"                 → 괄호 앞이 "경로석"
//
// 왜 유도하는가 — 게임 용어를 손으로 적으면 게임 표기가 바뀔 때 조용히 어긋난다.
// bases는 거래소 API로 대조되는 값이라(scripts/check-trade-bases.mjs) 여기서 나온 낱말도
// 그만큼 믿을 수 있다. CLAUDE.md §6-0.
//
// 쓰는 곳이 둘이라 모듈로 뺐다 — 유도를 두 번 구현하면 서로 어긋난다:
//   audit-terms.mjs  이 낱말이 화면 용어(i18n)와 같은가 검사
//   build-html.mjs   SEO 문구의 {waystone}/{tablet}에 채워 넣음
export function itemWords(locale) {
  const b = locale.bases;
  const all = ["breach", "irradiated", "abyss", "temple"].map((k) => b[k]);
  const [a, ...rest] = all;

  // 대소문자를 무시하고 비교한다 — 러시아어는 위치에 따라 첫 글자가 갈린다
  // ("Плитка Разлома" vs "Заражённая плитка"). 그대로 비교하면 "литка"로 잘린다.
  const lower = rest.map((s) => s.toLowerCase());

  let tablet = "";
  for (let i = 0; i < a.length; i++)
    for (let j = i + 1; j <= a.length; j++) {
      const s = a.slice(i, j);
      const t = s.toLowerCase();
      if (lower.every((r) => r.includes(t)) && s.trim().length > tablet.trim().length) tablet = s;
    }

  // 이름을 잇는 조사·연결어가 딸려 온다 (일본어 "の石板", 독일어 "-Tafel")
  tablet = tablet.trim().replace(/^(の|·|-|–|—|\s)+|(-|–|—|\s)+$/g, "");

  return { tablet, waystone: b.waystone.split(/[(（]/)[0].trim() };
}
