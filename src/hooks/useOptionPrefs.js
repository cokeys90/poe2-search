import { useState, useEffect, useCallback } from "react";
import { loadOptPrefs, saveOptPrefs } from "../lib/storage.js";
import { optId } from "../lib/options.js";

// 옵션 목록 개인화 — 그룹 안에서의 정렬 순서와 숨김.
// 저장은 옵션 id(optId)만 하므로 데이터가 바뀌어도 안전하다(모르는 id는 무시, 새 옵션은 원래 자리).
export function useOptionPrefs() {
  const [prefs, setPrefs] = useState(loadOptPrefs); // { [groupKey]: {order, hidden} }

  useEffect(() => {
    saveOptPrefs(prefs);
  }, [prefs]);

  const patch = useCallback((key, fn) => {
    setPrefs((p) => {
      const cur = p[key] || { order: [], hidden: [] };
      return { ...p, [key]: fn(cur) };
    });
  }, []);

  // 저장된 순서·숨김을 실제 목록에 적용 → { items(보이는 것), hidden(숨긴 것) }
  const applyTo = useCallback(
    (key, items) => {
      const cur = prefs[key];
      if (!cur) return { items, hidden: [] };
      const order = cur.order || [];
      const hiddenIds = new Set(cur.hidden || []);
      const rank = new Map(order.map((id, i) => [id, i]));
      // 순서에 없는(=새로 추가된) 옵션은 원래 자리를 유지하도록 뒤로 밀지 않고 원본 인덱스로 비교
      const sorted = [...items].sort((a, b) => {
        const ra = rank.has(optId(a.text)) ? rank.get(optId(a.text)) : Infinity;
        const rb = rank.has(optId(b.text)) ? rank.get(optId(b.text)) : Infinity;
        if (ra !== rb) return ra - rb;
        return items.indexOf(a) - items.indexOf(b);
      });
      return {
        items: sorted.filter((it) => !hiddenIds.has(optId(it.text))),
        hidden: sorted.filter((it) => hiddenIds.has(optId(it.text))),
      };
    },
    [prefs]
  );

  // 드래그해서 dragId를 targetId 자리로 옮긴다 (즐겨찾기 카드 이동과 같은 방식).
  // 저장은 그룹 전체 순서(숨긴 것 포함)로 남기되, 숨긴 항목은 원래 자리를 지킨다.
  const reorder = useCallback(
    (key, allItems, dragId, targetId) => {
      if (dragId === targetId) return;
      patch(key, (cur) => {
        const ids = orderedIds(cur.order, allItems);
        const hidden = new Set(cur.hidden || []);
        const visible = ids.filter((id) => !hidden.has(id));
        if (!visible.includes(dragId) || !visible.includes(targetId)) return cur;
        const rest = visible.filter((id) => id !== dragId);
        const ti = rest.indexOf(targetId);
        rest.splice(ti, 0, dragId); // 대상 앞에 삽입
        let vi = 0;
        const next = ids.map((id) => (hidden.has(id) ? id : rest[vi++]));
        return { ...cur, order: next };
      });
    },
    [patch]
  );

  const hide = useCallback(
    (key, allItems, itemId) => {
      patch(key, (cur) => ({
        order: orderedIds(cur.order, allItems), // 숨겨도 원래 자리를 기억
        hidden: [...new Set([...(cur.hidden || []), itemId])],
      }));
    },
    [patch]
  );

  const unhide = useCallback(
    (key, itemId) => {
      patch(key, (cur) => ({
        ...cur,
        hidden: (cur.hidden || []).filter((id) => id !== itemId),
      }));
    },
    [patch]
  );

  const reset = useCallback(() => setPrefs({}), []);

  const count = Object.values(prefs).reduce(
    (n, g) => n + (g.order?.length ? 1 : 0) + (g.hidden?.length || 0),
    0
  );

  return { applyTo, reorder, hide, unhide, reset, hasPrefs: count > 0 };
}

// 저장된 순서 + 아직 순서에 없는 옵션(원래 순서 유지) → 그룹 전체 id 목록
function orderedIds(order, allItems) {
  const all = allItems.map((it) => optId(it.text));
  const known = (order || []).filter((id) => all.includes(id));
  const rest = all.filter((id) => !known.includes(id));
  return [...known, ...rest];
}
