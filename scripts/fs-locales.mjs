// 검증 스크립트가 앱의 data/options.js를 그대로 쓰되, 로케일은 fs로 읽게 한다.
//
//   import "./fs-locales.mjs";   ← options.js를 쓰는 스크립트의 첫 줄에
//
// 왜 — 앱은 로케일을 동적 import로 받는다. 그런데 노드는 JSON 동적 import에
// `with { type: "json" }`을 요구하고, Vite dev는 그 속성이 붙으면 로딩이 깨진다(둘 다 겪었다).
// 어느 한쪽에 맞추면 다른 쪽이 깨지므로, 로더를 갈아끼운다. 앱 코드는 손대지 않는다.

import { readFileSync } from "node:fs";
import { setLocaleLoader } from "../src/data/options.js";

setLocaleLoader(async (lang) =>
  JSON.parse(readFileSync(`src/data/locales/${lang}.json`, "utf8"))
);
