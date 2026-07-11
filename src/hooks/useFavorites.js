import { useState, useEffect } from "react";
import { loadFavorites, saveFavorites } from "../lib/storage.js";

const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// 즐겨찾기 컬렉션(그룹/항목)의 상태와 CRUD·드래그 이동을 관리하는 훅.
// 현재 검색 상태에 의존하는 부분(스냅샷 생성·기본 이름)은 콜백으로 주입받는다.
//  - makeSnapshot(): 저장할 검색 스냅샷 객체
//  - makeName(): 새 항목의 기본 이름
export function useFavorites({ makeSnapshot, makeName }) {
  const [favData, setFavData] = useState(loadFavorites); // { groups:[{id,name,items}] }
  const [autoEditFavId, setAutoEditFavId] = useState(null); // 추가/생성 직후 인라인 편집
  const [autoEditGroupId, setAutoEditGroupId] = useState(null);
  const [pendingGroupDelete, setPendingGroupDelete] = useState(null); // 그룹 삭제 확인

  useEffect(() => {
    saveFavorites(favData);
  }, [favData]);

  function addToGroup(groupId) {
    const fav = { id: uid("f_"), name: makeName(), createdAt: Date.now(), ...makeSnapshot() };
    setFavData((prev) => ({
      groups: prev.groups.map((g) =>
        g.id === groupId ? { ...g, items: [...g.items, fav] } : g
      ),
    }));
    setAutoEditFavId(fav.id); // 추가 후 바로 이름 변경
  }

  function createGroup() {
    const g = { id: uid("g_"), name: "새 그룹", items: [] };
    setFavData((prev) => ({ groups: [...prev.groups, g] }));
    setAutoEditGroupId(g.id);
  }

  function renameGroup(id, name) {
    const n = (name || "").trim();
    setFavData((prev) => ({
      groups: prev.groups.map((g) => (g.id === id ? { ...g, name: n || g.name } : g)),
    }));
    setAutoEditGroupId(null);
  }

  function requestDeleteGroup(group) {
    if (group.items.length > 0) setPendingGroupDelete(group);
    else deleteGroup(group.id);
  }
  function deleteGroup(id) {
    setFavData((prev) => ({ groups: prev.groups.filter((g) => g.id !== id) }));
    setPendingGroupDelete(null);
  }

  function renameFav(favId, name) {
    const n = (name || "").trim();
    setFavData((prev) => ({
      groups: prev.groups.map((g) => ({
        ...g,
        items: g.items.map((it) => (it.id === favId ? { ...it, name: n || it.name } : it)),
      })),
    }));
    setAutoEditFavId(null);
  }
  function deleteFav(favId) {
    setFavData((prev) => ({
      groups: prev.groups.map((g) => ({ ...g, items: g.items.filter((it) => it.id !== favId) })),
    }));
  }

  // 기존 즐겨찾기를 현재 검색 상태로 덮어쓰기 (id·이름 유지, 내용만 갱신)
  function overwriteFav(favId) {
    const snap = makeSnapshot();
    setFavData((prev) => ({
      groups: prev.groups.map((g) => ({
        ...g,
        items: g.items.map((it) =>
          it.id === favId ? { id: it.id, name: it.name, createdAt: it.createdAt, ...snap } : it
        ),
      })),
    }));
  }

  function moveFav(favId, toGroupId, beforeFavId) {
    setFavData((prev) => {
      let dragged = null;
      const stripped = prev.groups.map((g) => {
        const idx = g.items.findIndex((i) => i.id === favId);
        if (idx >= 0) {
          dragged = g.items[idx];
          return { ...g, items: g.items.filter((i) => i.id !== favId) };
        }
        return g;
      });
      if (!dragged) return prev;
      // 대상 그룹: beforeFavId가 있으면 그 항목의 그룹, 없으면 toGroupId
      let destGroupId = toGroupId;
      if (beforeFavId != null) {
        const owner = stripped.find((g) => g.items.some((i) => i.id === beforeFavId));
        if (owner) destGroupId = owner.id;
      }
      const groups = stripped.map((g) => {
        if (g.id !== destGroupId) return g;
        const items = [...g.items];
        if (beforeFavId == null) items.push(dragged);
        else {
          const ti = items.findIndex((i) => i.id === beforeFavId);
          items.splice(ti < 0 ? items.length : ti, 0, dragged);
        }
        return { ...g, items };
      });
      return { groups };
    });
  }

  return {
    groups: favData.groups,
    autoEditFavId,
    autoEditGroupId,
    pendingGroupDelete,
    setPendingGroupDelete,
    addToGroup,
    createGroup,
    renameGroup,
    requestDeleteGroup,
    deleteGroup,
    renameFav,
    deleteFav,
    overwriteFav,
    moveFav,
  };
}
