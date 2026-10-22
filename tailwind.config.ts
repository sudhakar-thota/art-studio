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
        studio: {
          50: "#FAF8F5",
          100: "#F5F0E8",
          200: "#EADDCF",
          300: "#DAC3AF",
          400: "#C4A48A",
          500: "#A87E60",
          600: "#8C6346",
          700: "#6F4A32",
          800: "#543725",
          900: "#3D2719",
        },
        clay: "#C06C4E",
        terracotta: "#D97D54",
        canvas: "#F7F5F0",
        slateArt: "#2C3539",
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
