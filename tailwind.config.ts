import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gold: {
          DEFAULT: "#D4AF37",
          light: "#F3E5AB",
          dark: "#997A15",
        },
        whatsapp: {
          DEFAULT: "#25D366",
          dark: "#128C7E",
        },
      },
      transitionTimingFunction: {
        luxury: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      keyframes: {
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmerGold: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "float-slow": "floatSlow 6s ease-in-out infinite",
        "shimmer-gold": "shimmerGold 8s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
