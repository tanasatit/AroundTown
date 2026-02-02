import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Thai Theme Colors
        thai: {
          gold: "#D4AF37",
          "gold-dark": "#B8941E",
          red: "#DC2626",
          "red-dark": "#B91C1C",
          cream: "#FDF6E3",
          "cream-dark": "#F5E6D3",
          brown: "#3E2723",
          "brown-light": "#5D4037",
          border: "#D7CCC8",
        },
      },
      fontFamily: {
        display: ["Fredoka", "Mali", "sans-serif"],
        body: ["Kanit", "Sarabun", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        thai: "12px",
      },
    },
  },
  plugins: [],
};

export default config;