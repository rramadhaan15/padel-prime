import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        padel: {
          neon: "#D4FE2B",
          lime: "#CCFF00",
          emerald: "#10B981",
          dark: "#0B0F17",
          card: "#121A26",
          border: "#1F2B3E",
          hover: "#1A2536",
          accent: "#22D3EE",
        },
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(212, 254, 43, 0.3)",
        "glow-emerald": "0 0 25px -5px rgba(16, 185, 129, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
