/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,ts,tsx,css,scss}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require('tailwindcss-primeui')]
}

