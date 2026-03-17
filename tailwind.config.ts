import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "imf-accent": "#3B82F6",
        "imf-muted": "#8492B4",
        "imf-deep": "#0D1526",
        "imf-slate": "#1A2744",
        "imf-emerald": "#10B981",
        "imf-gold": "#F59E0B",
        "imf-rose": "#F43F5E",
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
