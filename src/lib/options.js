import { useMemo } from "react";
import { DATA } from "../data/options.js";

// 옵션 텍스트 → 고유 id (djb2)
export function optId(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return "o" + h;
}

// 현재 탭/서판종류에 맞는 옵션 그룹 구성
export function useOptionPool(tab, tabletType) {
  return useMemo(() => {
    if (tab === "waystone") {
      return {
        groups: [
          { title: "옵션", items: DATA.waystone.implicit },
          { title: "접두어", items: DATA.waystone.prefix },
          { title: "접미어", items: DATA.waystone.suffix },
        ],
      };
    }
    // 고유 접미어를 접미어보다 위에 (종류를 고른 이유가 고유 옵션이므로 먼저 보이게)
    const uniq = DATA.tablet.unique[tabletType] || [];
    const groups = [{ title: "접두어", items: DATA.tablet.common_prefix }];
    if (uniq.length) groups.push({ title: tabletType + " 고유 접미어", items: uniq });
    groups.push({ title: "접미어", items: DATA.tablet.common_suffix });
    return { groups, noUnique: uniq.length === 0 };
  }, [tab, tabletType]);
}
