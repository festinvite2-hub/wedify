import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        gold: "var(--g)",
        "gold-light": "var(--gl)",
        "gold-dark": "var(--gd)",
        cream: "var(--cr)",
        "cream-2": "var(--cr2)",
        ivory: "var(--iv)",
        ink: "var(--ink)",
        gray: "var(--gr)",
        mute: "var(--mt)",
        faint: "var(--ft)",
        ok: "var(--ok)",
        warn: "var(--wn)",
        err: "var(--er)",
        card: "var(--cd)",
        bg: "var(--bg)",
        border: "var(--bd)",
      },
      fontFamily: {
        sans: ["var(--f)"],
        display: ["var(--fd)"],
      },
      borderRadius: {
        card: "var(--r)",
        sm: "var(--rs)",
      },
      boxShadow: {
        card: "var(--sh)",
      },
      height: {
        header: "var(--hd)",
        nav: "var(--nv)",
      },
      animation: {
        "fade-up": "fadeUp 0.35s ease-out both",
        "slide-up": "slideUp 0.3s ease-out",
        spin: "spin 1s linear infinite",
        shake: "shake 0.3s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
