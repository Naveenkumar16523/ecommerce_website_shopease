/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./static/**/*.js",
    "./static/css/app.css"
  ],
  theme: {
    extend: {
      fontFamily: {
        'bebas': ['var(--font-bebas)', 'Impact', 'sans-serif'],
        'dm': ['var(--font-dm)', 'Inter', 'sans-serif'],
      },
      colors: {
        'brand-primary': '#A52A4E',
        'brand-bg': '#F2F0F1',
      },
    },
  },
  plugins: [],
}
