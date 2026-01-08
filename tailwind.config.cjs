module.exports = {
  content: [
    './*.html',
    './components/**/*.html',
    './assets/js/**/*.js'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: [],
};
