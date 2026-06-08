/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef5ff',
          100: '#d9e8ff',
          200: '#bcd4ff',
          300: '#8eb8ff',
          400: '#5990ff',
          500: '#3b6ef5',
          600: '#2450ea',
          700: '#1c3dd6',
          800: '#1e34ad',
          900: '#1e3188',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #eef5ff 0%, #f0f9ff 50%, #ecfeff 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.8) 100%)',
        'blue-gradient': 'linear-gradient(135deg, #3b6ef5 0%, #06b6d4 100%)',
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(220,100%,74%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(220,100%,74%,0.1) 0px, transparent 50%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(59, 110, 245, 0.08), 0 1px 0 rgba(255,255,255,0.8) inset',
        'glass-lg': '0 20px 60px rgba(59, 110, 245, 0.12), 0 1px 0 rgba(255,255,255,0.9) inset',
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(59,110,245,0.06)',
        'card-hover': '0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(59,110,245,0.12)',
        'button': '0 2px 8px rgba(59,110,245,0.3), 0 1px 2px rgba(59,110,245,0.2)',
        'button-hover': '0 4px 16px rgba(59,110,245,0.4), 0 2px 4px rgba(59,110,245,0.3)',
        'glow': '0 0 40px rgba(59,110,245,0.15)',
        'glow-cyan': '0 0 40px rgba(6,182,212,0.15)',
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
