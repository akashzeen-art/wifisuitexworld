/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/renderer/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        signal: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        teal: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        },
        surface: {
          50:  '#f8fafb',
          100: '#f1f5f4',
          200: '#e2e8e7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(145deg, #f0fdf4 0%, #f8fafb 45%, #ecfeff 100%)',
        'auth-gradient': 'linear-gradient(180deg, #f0fdf4 0%, #f8fafb 50%, #ecfeff 100%)',
        'dash-hero': 'linear-gradient(135deg, #059669 0%, #10b981 45%, #14b8a6 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 },                               to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      boxShadow: {
        'glass':      '0 8px 32px rgba(5, 150, 105, 0.08), 0 1px 0 rgba(255,255,255,0.8) inset',
        'card':       '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(5,150,105,0.06)',
        'card-hover': '0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(5,150,105,0.12)',
        'button':     '0 2px 8px rgba(5,150,105,0.28), 0 1px 2px rgba(5,150,105,0.18)',
        'button-hover':'0 4px 16px rgba(5,150,105,0.35), 0 2px 4px rgba(5,150,105,0.25)',
        'glow-green': '0 0 12px rgba(52,211,153,0.4)',
        'glow-red':   '0 0 12px rgba(248,113,113,0.4)',
        'glow':       '0 0 40px rgba(16,185,129,0.18)',
      },
    },
  },
  plugins: [],
}
