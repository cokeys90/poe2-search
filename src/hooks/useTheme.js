import { useState, useEffect } from "react";

const KEY = "poe2-search:theme";

// 현재 테마는 index.html inline script가 <html data-theme>에 이미 지정해 둠.
function currentTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

// 라이트/다크 테마 상태 + 토글. localStorage에 저장돼 재접속 시 유지.
export function useTheme() {
  const [theme, setTheme] = useState(currentTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      // 저장 실패 무시
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}
