import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#f7f1e6",
        paper: "#fbf8f1",
        ink: "#2b241d",
        deep: "#073d38",
        sage: "#b8c9b9",
        gold: "#b9874a",
        "gold-dark": "#9c6f39",
        line: "#d9cbb9",
        muted: "#6f6558",
        hairline: "rgba(43,36,29,0.1)",
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"DM Sans"', "Arial", "sans-serif"],
      },
      keyframes: {
        heroFadeUp: {
          "0%": { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        heroArtReveal: {
          "0%": { opacity: "0", transform: "scale(1.06)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        heroGlow: {
          "0%": { opacity: "0", transform: "scale(.85)" },
          "100%": { opacity: ".5", transform: "scale(1)" },
        },
        heroLine: {
          "0%": { transform: "scaleX(0)", opacity: "0" },
          "100%": { transform: "scaleX(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-up-1": "heroFadeUp .8s cubic-bezier(.22,1,.36,1) .15s both",
        "fade-up-2": "heroFadeUp .85s cubic-bezier(.22,1,.36,1) .28s both",
        "fade-up-3": "heroFadeUp .85s cubic-bezier(.22,1,.36,1) .40s both",
        "fade-up-4": "heroFadeUp .85s cubic-bezier(.22,1,.36,1) .52s both",
        "fade-up-5": "heroFadeUp .8s cubic-bezier(.22,1,.36,1) .66s both",
        "fade-up-6": "heroFadeUp .8s cubic-bezier(.22,1,.36,1) .78s both",
        "fade-up-7": "heroFadeUp .8s cubic-bezier(.22,1,.36,1) .90s both",
        "art-reveal": "heroArtReveal 1.3s cubic-bezier(.22,1,.36,1) .1s both",
        "glow-pulse": "heroGlow 1.6s ease-out .5s both",
        "line-grow": "heroLine 1s cubic-bezier(.22,1,.36,1) 1.1s both",
      },
    },
  },
  plugins: [],
};

export default config;
