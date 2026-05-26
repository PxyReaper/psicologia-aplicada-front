/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#025A7E',
          light: '#0378a5',
          dark: '#01415c',
        },
        accent: {
          DEFAULT: '#7D0147',
          light: '#a6025d',
          dark: '#5e0135',
        },
      },
    },
  },
  plugins: [],
};
