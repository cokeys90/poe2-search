import { IconInfo } from "./icons.jsx";

// 안내 콜아웃 (Notion의 info 블록 같은 모양). 내용 길이만큼만 넓어진다.
export default function Callout({ children }) {
  return (
    <div className="mb-[18px] inline-flex w-fit max-w-full items-center gap-2 rounded-md-s border border-primary/30 bg-primary/10 py-2 pl-3 pr-4 text-body-m text-on-surface">
      <IconInfo width={18} className="shrink-0 text-primary" />
      <span>{children}</span>
    </div>
  );
}
