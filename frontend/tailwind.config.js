/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors — Dark theme with Blue/Purple gradient palette
        brand: {
          blue: {
            50:  '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
          },
          purple: {
            50:  '#faf5ff',
            100: '#f3e8ff',
            200: '#e9d5ff',
            300: '#d8b4fe',
            400: '#c084fc',
            500: '#a855f7',
            600: '#9333ea',
            700: '#7e22ce',
            800: '#6b21a8',
            900: '#581c87',
          },
          indigo: {
            500: '#6366f1',
            600: '#4f46e5',
          },
        },
        // Dark background shades
        dark: {
          950: '#030712',
          900: '#0a0f1e',
          850: '#0d1424',
          800: '#111827',
          750: '#141b2d',
          700: '#1a2235',
          650: '#1e2d44',
          600: '#1f2937',
          500: '#374151',
        },
        // Glass morphism
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
          hover: 'rgba(255, 255, 255, 0.08)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        // Gradient presets
        'hero-gradient':     'linear-gradient(135deg, #030712 0%, #0a0f1e 40%, #0d1030 70%, #0a0820 100%)',
        'brand-gradient':    'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #a855f7 100%)',
        'card-gradient':     'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(168,85,247,0.1) 100%)',
        'sidebar-gradient':  'linear-gradient(180deg, #0a0f1e 0%, #0d1424 100%)',
        'glow-blue':         'radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%)',
        'glow-purple':       'radial-gradient(ellipse at center, rgba(168,85,247,0.15) 0%, transparent 70%)',
        'mesh-gradient':     'radial-gradient(at 40% 20%, hsla(228,100%,74%,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(271,100%,77%,0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(222,100%,70%,0.05) 0px, transparent 50%)',
      },
      animation: {
        'fade-in':       'fadeIn 0.6s ease-out',
        'fade-in-up':    'fadeInUp 0.6s ease-out',
        'fade-in-down':  'fadeInDown 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'slide-in-right':'slideInRight 0.4s ease-out',
        'pulse-glow':    'pulseGlow 2s ease-in-out infinite',
        'float':         'float 6s ease-in-out infinite',
        'shimmer':       'shimmer 2s linear infinite',
        'spin-slow':     'spin 8s linear infinite',
        'bounce-slow':   'bounce 3s ease-in-out infinite',
        'gradient-shift':'gradientShift 8s ease infinite',
        'typing-blink':  'blink 1s step-end infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%':   { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59,130,246,0.3)' },
          '50%':      { boxShadow: '0 0 40px rgba(168,85,247,0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
      },
      boxShadow: {
        'brand':       '0 0 40px rgba(59,130,246,0.2)',
        'brand-lg':    '0 0 80px rgba(59,130,246,0.3)',
        'purple':      '0 0 40px rgba(168,85,247,0.2)',
        'purple-lg':   '0 0 80px rgba(168,85,247,0.3)',
        'card':        '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover':  '0 8px 40px rgba(0,0,0,0.6)',
        'glow-sm':     '0 0 15px rgba(59,130,246,0.3)',
        'glass':       '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
}
