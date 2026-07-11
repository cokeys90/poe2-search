/** @type {import('tailwindcss').Config} */

// Material 3 색 역할 → CSS 변수 매핑. rgb(var(--x) / <alpha-value>)로 감싸
// bg-primary/20 같은 opacity 수식어가 동작하게 한다. 변수는 index.css에 정의.
const mdColor = (name) => `rgb(var(--md-${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // ── Material 3 역할 ──
        primary: mdColor("primary"),
        "on-primary": mdColor("on-primary"),
        "primary-container": mdColor("primary-container"),
        "on-primary-container": mdColor("on-primary-container"),
        secondary: mdColor("secondary"),
        "on-secondary": mdColor("on-secondary"),
        "secondary-container": mdColor("secondary-container"),
        "on-secondary-container": mdColor("on-secondary-container"),
        tertiary: mdColor("tertiary"),
        "on-tertiary": mdColor("on-tertiary"),
        "tertiary-container": mdColor("tertiary-container"),
        "on-tertiary-container": mdColor("on-tertiary-container"),
        error: mdColor("error"),
        "on-error": mdColor("on-error"),
        "error-container": mdColor("error-container"),
        "on-error-container": mdColor("on-error-container"),
        surface: mdColor("surface"),
        "surface-dim": mdColor("surface-dim"),
        "surface-bright": mdColor("surface-bright"),
        "surface-c-lowest": mdColor("surface-container-lowest"),
        "surface-c-low": mdColor("surface-container-low"),
        "surface-c": mdColor("surface-container"),
        "surface-c-high": mdColor("surface-container-high"),
        "surface-c-highest": mdColor("surface-container-highest"),
        "on-surface": mdColor("on-surface"),
        "on-surface-variant": mdColor("on-surface-variant"),
        outline: mdColor("outline"),
        "outline-variant": mdColor("outline-variant"),
      },
      fontFamily: {
        cinzel: ["Cinzel", "serif"],
        mono: ['"JetBrains Mono"', '"Consolas"', "monospace"],
      },
      // Material 3 타입 스케일 — [size, { lineHeight, letterSpacing, fontWeight }]
      fontSize: {
        "display-l": ["57px", { lineHeight: "64px", letterSpacing: "-0.25px" }],
        "display-m": ["45px", { lineHeight: "52px" }],
        "display-s": ["36px", { lineHeight: "44px" }],
        "headline-l": ["32px", { lineHeight: "40px" }],
        "headline-m": ["28px", { lineHeight: "36px" }],
        "headline-s": ["24px", { lineHeight: "32px" }],
        "title-l": ["22px", { lineHeight: "28px" }],
        "title-m": ["16px", { lineHeight: "24px", letterSpacing: "0.15px", fontWeight: "500" }],
        "title-s": ["14px", { lineHeight: "20px", letterSpacing: "0.1px", fontWeight: "500" }],
        "body-l": ["16px", { lineHeight: "24px", letterSpacing: "0.5px" }],
        "body-m": ["14px", { lineHeight: "20px", letterSpacing: "0.25px" }],
        "body-s": ["12px", { lineHeight: "16px", letterSpacing: "0.4px" }],
        "label-l": ["14px", { lineHeight: "20px", letterSpacing: "0.1px", fontWeight: "500" }],
        "label-m": ["12px", { lineHeight: "16px", letterSpacing: "0.5px", fontWeight: "500" }],
        "label-s": ["11px", { lineHeight: "16px", letterSpacing: "0.5px", fontWeight: "500" }],
      },
      // Material 3 shape 스케일 (모서리 반경)
      borderRadius: {
        "md-xs": "4px",
        "md-s": "8px",
        "md-m": "12px",
        "md-l": "16px",
        "md-xl": "28px",
      },
    },
  },
  plugins: [],
};
