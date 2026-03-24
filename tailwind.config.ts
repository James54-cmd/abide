import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: "#FAF7F2",
        ink: "#2C1F0E",
        gold: "#C9973A",
        muted: "#8C7B6A",
        accent: "#D4A843",
        "dark-bg": "#1A1410",
        "dark-card": "#231E18",
      },
      fontFamily: {
        serif: ["Lora", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        warm: "0 2px 12px rgba(44, 31, 14, 0.08)",
        "warm-lg": "0 4px 24px rgba(44, 31, 14, 0.12)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 80%, 100%": { opacity: "0.3", transform: "scale(0.8)" },
          "40%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
