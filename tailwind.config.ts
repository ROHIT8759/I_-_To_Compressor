import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#edf7f3",
          100: "#d4ece2",
          200: "#aadac7",
          300: "#76c1a3",
          400: "#49a582",
          500: "#2f8868",
          600: "#236c54",
          700: "#1f5644",
          800: "#1d4538",
          900: "#18392f",
        },
      },
      boxShadow: {
        soft: "0 12px 40px -14px rgba(23, 40, 62, 0.35)",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at 20% 20%, rgba(72, 184, 140, 0.22), transparent 38%), radial-gradient(circle at 80% 5%, rgba(46, 180, 161, 0.16), transparent 28%), radial-gradient(circle at 50% 100%, rgba(37, 104, 255, 0.14), transparent 34%)",
      },
    },
  },
  plugins: [],
};

export default config;
