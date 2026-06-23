/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
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
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(145deg, #f0fdf4 0%, #f8fafb 45%, #ecfeff 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,250,0.85) 100%)',
        'blue-gradient': 'linear-gradient(135deg, #059669 0%, #14b8a6 100%)',
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(160,84%,39%,0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(174,72%,40%,0.1) 0px, transparent 50%), radial-gradient(at 0% 60%, hsla(152,60%,45%,0.08) 0px, transparent 50%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(5, 150, 105, 0.08), 0 1px 0 rgba(255,255,255,0.8) inset',
        'glass-lg': '0 20px 60px rgba(5, 150, 105, 0.1), 0 1px 0 rgba(255,255,255,0.9) inset',
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(5,150,105,0.06)',
        'card-hover': '0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(5,150,105,0.12)',
        'button': '0 2px 8px rgba(5,150,105,0.28), 0 1px 2px rgba(5,150,105,0.18)',
        'button-hover': '0 4px 16px rgba(5,150,105,0.35), 0 2px 4px rgba(5,150,105,0.25)',
        'glow': '0 0 40px rgba(16,185,129,0.18)',
        'glow-cyan': '0 0 40px rgba(20,184,166,0.18)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'spin-slow': 'spin 8s linear infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
