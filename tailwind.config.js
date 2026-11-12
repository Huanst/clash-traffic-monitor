/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        mac: {
          bg: "rgba(30, 30, 30, 0.85)",
          border: "rgba(255, 255, 255, 0.12)",
        }
      }
    },
  },
  plugins: [],
}
