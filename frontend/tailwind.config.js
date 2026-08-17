/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Codium-inspired accent palette: restrained pink on a graphite surface.
        primary: {
          50: '#fff1f4',
          100: '#ffe1e8',
          200: '#ffc3d0',
          300: '#ff98ae',
          400: '#ff6b8f',
          500: '#ef3f68',
          600: '#dc3159',
          700: '#bb2447',
          800: '#8f203d',
          900: '#641d34',
          950: '#3f1424'
        },
        // Neutral accent scale used for secondary UI and quiet metadata.
        accent: {
          50: '#f6f7f8',
          100: '#e5e7ea',
          200: '#c9cdd2',
          300: '#a7adb4',
          400: '#858c94',
          500: '#656c74',
          600: '#4d535a',
          700: '#373c42',
          800: '#25292e',
          900: '#181a1d',
          950: '#0f1012'
        },
        // Graphite surfaces used by the dark application shell.
        dark: {
          50: '#f6f7f8',
          100: '#dfe2e6',
          200: '#b5bac1',
          300: '#8e949c',
          400: '#6e747c',
          500: '#535860',
          600: '#3b3f45',
          700: '#2a2e33',
          800: '#202328',
          900: '#16181b',
          950: '#0f1012'
        }
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif'
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      boxShadow: {
        glass: '0 12px 36px rgba(0, 0, 0, 0.28)',
        'glass-sm': '0 6px 20px rgba(0, 0, 0, 0.24)',
        glow: '0 0 20px rgba(239, 63, 104, 0.2)',
        'glow-lg': '0 0 40px rgba(239, 63, 104, 0.3)',
        card: '0 10px 28px rgba(0, 0, 0, 0.18)',
        'card-hover': '0 16px 40px rgba(0, 0, 0, 0.28)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #ef3f68 0%, #ef3f68 100%)',
        'gradient-dark': 'linear-gradient(135deg, #202328 0%, #0f1012 100%)',
        'gradient-glass':
          'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'mesh-gradient': 'none'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
        glow: 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(239, 63, 104, 0.18)' },
          '100%': { boxShadow: '0 0 30px rgba(239, 63, 104, 0.32)' }
        }
      },
      backdropBlur: {
        xs: '2px'
      },
      borderRadius: {
        '4xl': '2rem'
      }
    }
  },
  plugins: []
}
