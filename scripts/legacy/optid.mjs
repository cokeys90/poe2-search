// 다국어 도입 전 쓰던 옵션 id — 한국어 원문의 djb2 해시.
// 앱에서는 제거됐고, 옛 localStorage 값을 새 안정키로 이관하는 매핑을 만들 때만 쓴다.
export function optId(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return "o" + h;
}
