/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        bg: '#0a0c10',
        surface: '#12151c',
        'surface-2': '#191d27',
        border: '#262b36',
        chrome: '#c9d0dc',
        amber: '#ffb020',
        muted: '#8790a3',
        blue: { DEFAULT: '#2f5eff', glow: '#6f95ff', dark: '#1c3fcc' },
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
