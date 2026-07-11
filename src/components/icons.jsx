// Material Symbols(Outlined) 기반 아이콘. index.html에서 폰트 로드(필요 글리프만 subset).
// export 이름/시그니처는 유지 — width는 글리프 font-size로 매핑, className 그대로 전달.
function Symbol({ name, width = 24, className = "" }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: width }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

export const IconTablet = (p) => <Symbol name="description" {...p} />;
export const IconWaystone = (p) => <Symbol name="diamond" {...p} />;
export const IconMail = (p) => <Symbol name="mail" {...p} />;
export const IconStar = (p) => <Symbol name="star" {...p} />;
export const IconMenu = (p) => <Symbol name="menu" {...p} />;
export const IconChevronLeft = (p) => <Symbol name="chevron_left" {...p} />;
export const IconClose = (p) => <Symbol name="close" {...p} />;
export const IconEdit = (p) => <Symbol name="edit" {...p} />;
export const IconTrash = (p) => <Symbol name="delete" {...p} />;
