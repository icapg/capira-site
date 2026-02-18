/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f7ff",
          100: "#e6efff",
          200: "#cfe0ff",
          300: "#a9c7ff",
          400: "#7aa5ff",
          500: "#4f83ff",
          600: "#2f64f3",
          700: "#224bd6",
          800: "#1f3fae",
          900: "#1e378d",
        },
      },
    },
  },
  plugins: [],
};
