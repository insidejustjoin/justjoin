/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#DA2222',
        'primary-sub': '#B81C1C',
        accent: '#237ED9',
        'accent-sub': '#6BAEEA',
      },
    },
  },
  plugins: [],
}
