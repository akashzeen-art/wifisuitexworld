/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/renderer/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef5ff',
          100: '#d9e8ff',
          400: '#5990ff',
          500: '#3b6ef5',
          600: '#2450ea',
          700: '#1c3dd6',
        },
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
        'glass':      '0 4px 24px rgba(59,110,245,0.08), 0 1px 0 rgba(255,255,255,0.8) inset',
        'card':       '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(59,110,245,0.06)',
        'button':     '0 2px 8px rgba(59,110,245,0.3)',
        'glow-green': '0 0 12px rgba(52,211,153,0.4)',
        'glow-red':   '0 0 12px rgba(248,113,113,0.4)',
      },
    },
  },
  plugins: [],
}
