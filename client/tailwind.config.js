/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sky: {
          300: '#C9BFFF',
          400: '#9B7BFF',
          500: '#8B6FF0',
          600: '#7657DF',
          700: '#6244C7'
        }
      }
    }
  },
  plugins: []
}
