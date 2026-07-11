import { IconStar } from "./icons.jsx";

// 우측 즐겨찾기 패널 placeholder. 실제 즐겨찾기 기능은 추후 구현 (CLAUDE.md TODO).
export default function RightPanel() {
  return (
    <aside className="hidden w-72 shrink-0 border-l border-outline-variant bg-surface-c-low xl:block">
      <div className="flex items-center gap-2 border-b border-outline-variant px-5 py-4">
        <IconStar width={20} height={20} className="text-primary" />
        <span className="text-title-s text-on-surface">즐겨찾기</span>
      </div>
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <IconStar width={40} height={40} className="text-outline" />
        <p className="text-body-s text-on-surface-variant">
          자주 쓰는 검색 조합을
          <br />
          여기에 저장할 수 있어요
          <br />
          <span className="text-outline">(준비 중)</span>
        </p>
      </div>
    </aside>
  );
}
