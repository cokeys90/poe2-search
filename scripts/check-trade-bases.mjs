// 거래소 기본 타입명 검증 — 우리 로케일의 bases가 그 언어 거래소에 실제로 존재하는가.
//
// query.type에 넣는 이름이 거래소의 이름과 한 글자라도 다르면 검색이 통째로 빈다.
// 우리 bases는 poe2db(게임 원문)에서 왔고 거래소는 GGG API라 출처가 다르다 → 대조가 필요하다.
//
//   node scripts/check-trade-bases.mjs
//
// GGG 정책: 식별 가능한 User-Agent 필수. 요청은 언어당 1회뿐이다.

import fs from "node:fs";

const UA = "poe2-search/1.0 (contact: https://github.com/cokeys90/poe2-search)";

// 언어 → 그 언어의 거래소 호스트. 글로벌은 언어별 서브도메인이 따로 있다.
const HOSTS = {
  kr: ["https://poe.kakaogames.com", "https://kr.pathofexile.com"],
  us: ["https://www.pathofexile.com"],
  jp: ["https://jp.pathofexile.com"],
  tw: ["https://pathofexile.tw"],
  ru: ["https://ru.pathofexile.com"],
  pt: ["https://br.pathofexile.com"],
  th: ["https://th.pathofexile.com"],
  fr: ["https://fr.pathofexile.com"],
  de: ["https://de.pathofexile.com"],
  sp: ["https://es.pathofexile.com"],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function typesOf(host) {
  const res = await fetch(`${host}/api/trade2/data/items`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${host} → HTTP ${res.status}`);
  const j = await res.json();
  return new Set(j.result.flatMap((c) => c.entries).map((e) => e.type).filter(Boolean));
}

let fail = 0;
for (const [lang, hosts] of Object.entries(HOSTS)) {
  const bases = JSON.parse(fs.readFileSync(`src/data/locales/${lang}.json`, "utf8")).bases;
  for (const host of hosts) {
    let types;
    try {
      types = await typesOf(host);
    } catch (e) {
      console.log(`❌ ${lang} ${host} — ${e.message}`);
      fail++;
      continue;
    }
    const missing = [];
    for (const [k, v] of Object.entries(bases)) {
      // 경로석은 등급 자리가 템플릿이다 — 1등급으로 실체화해 대조한다
      const name = k === "waystone" ? v.replace("{tier}", "1") : v;
      if (!types.has(name)) missing.push(`${k}="${name}"`);
    }
    if (missing.length) {
      fail++;
      console.log(`❌ ${lang.padEnd(3)} ${host}`);
      missing.forEach((m) => console.log(`      없음: ${m}`));
    } else {
      console.log(`✅ ${lang.padEnd(3)} ${host} — 기본 타입 9개 전부 일치`);
    }
    await sleep(1500); // 레이트리밋 존중
  }
}

console.log(fail ? `\n실패 ${fail}건` : "\n전부 통과");
process.exit(fail ? 1 : 0);
