/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#F97316',
        'surface-base': '#F3F4F6',
      }
    },
  },
  plugins: [],
}
