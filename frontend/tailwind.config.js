/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0a0a0a',
        panel: 'rgba(18, 10, 10, 0.75)',
        'panel-hover': 'rgba(30, 14, 14, 0.85)',
        fire: '#ff2d2d',
        ember: '#ff6a00',
        orange: '#ff8c00',
        hot: '#ff4500',
        cyan: '#ff2d2d', // mapped to fire for consistency with previous CSS
        violet: '#ff6a00', // mapped to ember
        pink: '#ff4500', // mapped to hot
        main: '#f0eded',
        muted: '#888',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Outfit', 'sans-serif'],
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      }
    },
  },
  plugins: [],
}
