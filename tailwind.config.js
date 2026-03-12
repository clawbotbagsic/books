/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          amber: '#F59E0B',
          orange: '#EA580C',
          warm: '#FEF3C7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        fredoka: ['var(--font-fredoka)', 'sans-serif'],
        caveat: ['var(--font-caveat)', 'cursive'],
        nunito: ['var(--font-nunito)', 'sans-serif'],
      },
      keyframes: {
        'scroll-left': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'scroll-left': 'scroll-left 30s linear infinite',
      },
    },
  },
  plugins: [],
}
