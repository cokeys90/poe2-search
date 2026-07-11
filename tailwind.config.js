/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // PoE2 다크 + 골드 팔레트
        ink: "#e8dcc0",
        mute: "#9a8c6f",
        gold: "#c9a24b",
        "gold-hi": "#e8c874",
        edge: "#3a2f1c",
        rune: "#4a9b8e",
        "rune-bg": "#12201d",
        copper: "#b04a3a",
        "copper-bg": "#1f1310",
        bg0: "#0a0705",
        bg1: "#100c07",
        panel: "#17110a",
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        mono: ['"JetBrains Mono"', '"Consolas"', 'monospace'],
      },
      keyframes: {
        optin: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        glow: {
          "0%,100%": { boxShadow: "0 0 20px rgba(201,162,75,.12)" },
          "50%": { boxShadow: "0 0 28px rgba(201,162,75,.22)" },
        },
      },
      animation: {
        optin: "optin .5s cubic-bezier(.22,1,.36,1) forwards",
        glow: "glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
