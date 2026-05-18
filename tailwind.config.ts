import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nova: {
          bg:       '#070710',
          bg2:      '#0d0d1e',
          bg3:      '#12122a',
          card:     '#0f0f22',
          border:   '#1c1c35',
          muted:    '#55556e',
          text:     '#f1f1fa',
          text2:    '#9898ba',
          accent:   '#e63950',
          accent2:  '#ff5c2e',
          purple:   '#9333ea',
          teal:     '#0d9488',
          gold:     '#f59e0b',
          success:  '#10b981',
        },
      },
      fontFamily: {
        sans:  ['Outfit', 'system-ui', 'sans-serif'],
        mono:  ['Space Mono', 'monospace'],
      },
      backgroundImage: {
        'nova-gradient': 'linear-gradient(135deg, #e63950, #ff5c2e, #ffac30)',
        'card-gradient': 'linear-gradient(to top, rgba(7,7,16,1) 0%, rgba(7,7,16,0.6) 50%, transparent 100%)',
        'hero-gradient': 'linear-gradient(to right, rgba(7,7,16,0.95) 30%, transparent 70%)',
      },
      animation: {
        'shimmer':       'shimmer 2s infinite linear',
        'fade-in':       'fadeIn 0.3s ease-out',
        'slide-up':      'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':      'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-glow':    'pulseGlow 2s ease-in-out infinite',
        'progress-fill': 'progressFill 0.5s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(230, 57, 80, 0.3)' },
          '50%':      { boxShadow: '0 0 40px rgba(230, 57, 80, 0.7)' },
        },
        progressFill: {
          from: { width: '0%' },
        },
      },
      backdropBlur: { xs: '2px' },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
