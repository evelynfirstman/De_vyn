/* eslint-disable @typescript-eslint/no-require-imports -- tailwind config requires CommonJS preset */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          900: "#0B3D36",
          700: "#0E5F54",
          500: "#12836F",
          300: "#5CB8A3",
          100: "#DCF2EA",
          50: "#EEFAF5",
        },
        accent: {
          600: "#D9622B",
          500: "#F97316",
          100: "#FFEDD5",
        },
        ink: {
          900: "#101828",
          700: "#344054",
          500: "#667085",
          300: "#D0D5DD",
          100: "#F2F4F7",
          50: "#F9FAFB",
        },
        score: {
          low: "#E5484D",
          mid: "#F5A524",
          high: "#18A957",
        },
        danger: "#D92D20",
        surface: {
          base: "#F9F9FF",
          container: "#E9EDFF",
          low: "#F1F3FF",
        },
      },
      fontFamily: {
        sans: ["PlusJakartaSans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
    },
  },
  plugins: [],
};
