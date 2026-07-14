import { useMemo } from "react";
import { DATA, LANG, tabletName } from "../data/options.js";
import { t } from "../i18n/index.js";

// 그룹 이름은 화면 문구다 (i18n). 고유 접미어 그룹만 서판 종류 이름이 들어간다.
const groupName = (id, tabletType) =>
  id === "unique" ? t("group.unique", { type: tabletName(tabletType) }) : t(`group.${id}`);

// 옵션 목록 개인화(순서·숨김)의 저장 키. 언어가 바뀌어도 같아야 하므로 그룹 id로 만든다.
// 고유 접미어는 서판 종류마다 목록이 다르니 종류(slug)까지 키에 넣는다.
export const groupPrefKey = (tab, tabletType, groupId) =>
  groupId === "unique" ? `tablet:unique:${tabletType}` : `${tab}:${groupId}`;

// 현재 탭/서판종류에 맞는 옵션 그룹 구성.
// title은 표시용(언어별)이고, 분기·저장·DOM 셀렉터에 쓰는 건 id다.
export function useOptionPool(tab, tabletType) {
  return useMemo(() => {
    if (tab === "waystone") {
      return {
        groups: [
          { id: "implicit", title: groupName("implicit"), items: DATA.waystone.implicit },
          { id: "prefix", title: groupName("prefix"), items: DATA.waystone.prefix },
          { id: "suffix", title: groupName("suffix"), items: DATA.waystone.suffix },
        ],
      };
    }
    // 고유 접미어를 접미어보다 위에 (종류를 고른 이유가 고유 옵션이므로 먼저 보이게)
    const uniq = DATA.tablet.unique[tabletType] || [];
    const groups = [{ id: "prefix", title: groupName("prefix"), items: DATA.tablet.prefix }];
    if (uniq.length) {
      groups.push({ id: "unique", title: groupName("unique", tabletType), items: uniq });
    }
    groups.push({ id: "suffix", title: groupName("suffix"), items: DATA.tablet.suffix });
    return { groups, noUnique: uniq.length === 0 };
    // LANG이 의존성에 있어야 언어가 바뀔 때 그룹 제목·옵션 원문이 다시 계산된다
  }, [tab, tabletType, LANG]);
}
