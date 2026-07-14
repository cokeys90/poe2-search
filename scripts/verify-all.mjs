// 전체 검증 러너 — 자동 검증을 전부 돌리고 결과 보고서를 남긴다.
//
//   node scripts/verify-all.mjs           오프라인 검증만 (빠름)
//   node scripts/verify-all.mjs --net     네트워크 검증까지 (poe2db·거래소 API)
//
// 보고서: docs/verification-report.md  (무엇을 언제 돌려 어떻게 나왔는지)
//
// 왜 러너인가 — 검증기가 여러 개인데 "무엇을 돌렸고 무엇을 안 돌렸는지"가 남지 않았다.
// 검증을 안 한 것과 검증해서 통과한 것은 다르다. 보고서에 둘을 구분해 적는다.
//
// 기능↔검증 대응은 docs/verification-spec.md 에 있다. 여기 CHECKS와 어긋나면 안 된다.

import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";

const NET = process.argv.includes("--net");

const CHECKS = [
  { id: "V-B", name: "범위 정규식 경계값", cmd: "node scripts/test-range.mjs", covers: "F-03", net: false },
  { id: "V-C", name: "검색조각 유효성", cmd: "node scripts/frag-check.mjs", covers: "F-01 F-03", net: false },
  { id: "V-D", name: "복합 모드 실제 옵션 줄", cmd: "node scripts/audit-multiline.mjs", covers: "F-01", net: false },
  { id: "V-G", name: "거래소 왕복", cmd: "node scripts/test-trade.mjs", covers: "F-06 F-07", net: false },
  { id: "V-H", name: "250자 예산", cmd: "node scripts/test-budget.mjs", covers: "F-03 F-12", net: false },
  { id: "V-A", name: "골든 회귀", cmd: "GOLDEN", covers: "F-03", net: false },
  { id: "V-I", name: "빌드 (경로 정합 포함)", cmd: "npm run build", covers: "F-12 F-13", net: false },
  { id: "V-E", name: "게임 용어 ↔ poe2db", cmd: "node scripts/audit-terms.mjs", covers: "F-12", net: true },
  { id: "V-F", name: "기본 타입명 ↔ 거래소 API", cmd: "node scripts/check-trade-bases.mjs", covers: "F-06 F-12", net: true },
];

// 골든은 diff라 따로 다룬다 — 결과가 "달라진 게 없다"여야 한다
function golden() {
  const out = execSync("node scripts/golden.mjs", { encoding: "utf8", maxBuffer: 1e8 });
  const base = execSync("git show HEAD:tests/golden.baseline.txt", {
    encoding: "utf8",
    maxBuffer: 1e8,
  });
  if (out !== base) {
    const a = out.split("\n");
    const b = base.split("\n");
    const diff = a.filter((l, i) => l !== b[i]).slice(0, 5);
    throw new Error(`검색어 생성 결과가 베이스라인과 다르다\n  ${diff.join("\n  ")}`);
  }
  return `${out.trim().split("\n").length}개 케이스 — 베이스라인과 바이트 동일`;
}

const results = [];
for (const c of CHECKS) {
  if (c.net && !NET) {
    results.push({ ...c, status: "건너뜀", detail: "네트워크 검증 (--net으로 실행)" });
    console.log(`⏭  ${c.id} ${c.name} — 건너뜀`);
    continue;
  }
  const t0 = Date.now();
  try {
    const detail =
      c.cmd === "GOLDEN"
        ? golden()
        : execSync(c.cmd, { encoding: "utf8", maxBuffer: 1e8 }).trim().split("\n").slice(-1)[0];
    results.push({ ...c, status: "통과", detail, ms: Date.now() - t0 });
    console.log(`✅ ${c.id} ${c.name}`);
  } catch (e) {
    const detail = (e.stdout || "") + (e.message || "");
    results.push({ ...c, status: "실패", detail: detail.trim().slice(-400), ms: Date.now() - t0 });
    console.log(`❌ ${c.id} ${c.name}`);
  }
}

/* ── 보고서 ─────────────────────────────────────────────────────── */

const stamp = execSync('git log -1 --format="%h %cI"', { encoding: "utf8" }).trim();
const icon = { 통과: "✅", 실패: "❌", 건너뜀: "⏭" };

const md = `# 검증 결과 보고서

> \`node scripts/verify-all.mjs${NET ? " --net" : ""}\` 가 만든다. **손으로 고치지 말 것.**
> 무엇을 검증하는지는 [verification-spec.md](verification-spec.md), 기능 목록은 [feature-spec.md](feature-spec.md).

- 커밋: \`${stamp}\`
- 범위: ${NET ? "오프라인 + 네트워크" : "오프라인만 (네트워크 검증은 건너뜀)"}

| | 검증 | 덮는 기능 | 결과 |
|---|---|---|---|
${results
  .map((r) => `| ${icon[r.status]} | ${r.id} ${r.name} | ${r.covers} | ${r.status === "실패" ? "**실패**" : r.detail.replace(/\|/g, "\\|").slice(0, 90)} |`)
  .join("\n")}

${results.filter((r) => r.status === "실패").length ? `## 실패\n\n${results.filter((r) => r.status === "실패").map((r) => `### ${r.id} ${r.name}\n\n\`\`\`\n${r.detail}\n\`\`\``).join("\n\n")}\n` : ""}
## 자동으로 검증하지 못하는 것

아래는 **사람이 브라우저에서 봐야 한다.** 검증 안 한 것을 통과했다고 적지 않기 위해 여기 남긴다.
절차는 [verification-spec.md](verification-spec.md)의 "수동 검증",
**직접 본 결과는 [manual-checks.md](manual-checks.md)** 에 적는다 (이 파일은 자동 생성이라 못 적는다).

- F-08 즐겨찾기 (그룹·저장·드래그 이동·플로팅 창)
- F-09 핀 · F-10 옵션 순서·숨김
- F-14 localStorage 이관 (옛 한글 id → 안정키)
- F-15 테마·반응형·창 드래그
- F-12 폰트 (키릴·태국어·한자가 안 깨지는가)
- F-13 배포된 \`/en/\` 경로 실제 접속
- **인게임 검색 실제 동작** — 최종 판정자. 자동 검증은 "우리 규칙대로 만들어졌다"까지만 보증한다
`;

mkdirSync("docs", { recursive: true });
writeFileSync("docs/verification-report.md", md);

const failed = results.filter((r) => r.status === "실패").length;
console.log(`\ndocs/verification-report.md 갱신`);
console.log(failed ? `실패 ${failed}건` : "자동 검증 전부 통과");
process.exit(failed ? 1 : 0);
