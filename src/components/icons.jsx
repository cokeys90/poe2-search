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
export const IconStar = (p) => <Symbol name="star" {...p} />;
export const IconMenu = (p) => <Symbol name="menu" {...p} />;
export const IconChevronLeft = (p) => <Symbol name="chevron_left" {...p} />;
export const IconClose = (p) => <Symbol name="close" {...p} />;
export const IconEdit = (p) => <Symbol name="edit" {...p} />;
export const IconTrash = (p) => <Symbol name="delete" {...p} />;
export const IconAdd = (p) => <Symbol name="add" {...p} />;
export const IconExpand = (p) => <Symbol name="expand_more" {...p} />;
export const IconSave = (p) => <Symbol name="save" {...p} />;
export const IconCheck = (p) => <Symbol name="check" {...p} />;
export const IconInfo = (p) => <Symbol name="info" {...p} />;
export const IconLightMode = (p) => <Symbol name="light_mode" {...p} />;
export const IconDarkMode = (p) => <Symbol name="dark_mode" {...p} />;
