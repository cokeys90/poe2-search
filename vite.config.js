import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // ⚠️ 상대경로("./")면 안 된다 — /en/index.html이 /en/assets/…를 찾게 돼 하위 경로가 통째로 깨진다
  base: "/",
});
