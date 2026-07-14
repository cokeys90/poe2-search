import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./lib/firebase.js";
import { restoreLang } from "./hooks/useLang.js";

// 저장된 언어를 첫 렌더 '전에' 복원한다. 언어가 바뀌면 옵션 원문·검색조각이 통째로 갈리므로,
// 렌더 후에 바꾸면 한국어로 한 번 그려졌다가 뒤바뀌는 깜빡임이 보인다.
// (top-level await는 빌드 타깃이 지원하지 않아 then으로 쓴다.)
restoreLang().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
