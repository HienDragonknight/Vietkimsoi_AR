import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          light: "rgba(255,255,255,0.18)",
          border: "rgba(255,255,255,0.35)",
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-2%)", opacity: "0.2" },
          "50%": { transform: "translateY(100%)", opacity: "1" },
          "100%": { transform: "translateY(-2%)", opacity: "0.2" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.03)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        scanline: "scanline 2.4s ease-in-out infinite",
        breathe: "breathe 3.2s ease-in-out infinite",
        "fade-in": "fadeIn 0.6s ease-out forwards",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.25)",
        "glass-lg": "0 20px 60px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
