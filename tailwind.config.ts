import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        brick: "var(--brick)",
        sand: "var(--sand)",
        paper: "var(--paper)",
        teal: "var(--teal)",
        line: "var(--line)",
      },
      fontFamily: {
        serif: ["Fraunces", "serif"],
        sans: ["'Work Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
