/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#04040F',
          secondary: '#080818',
          card: '#0D0D20',
        },
        accent: {
          purple: '#8B5CF6',
          pink: '#EC4899',
          cyan: '#06B6D4',
          orange: '#F97316',
          red: '#EF4444',
          green: '#10B981',
          yellow: '#F59E0B',
        },
        text: {
          primary: '#F8F8FF',
          secondary: '#A0A0C0',
          muted: '#505070',
        }
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      boxShadow: {
        'glow-purple': '0 0 30px rgba(139,92,246,0.35)',
        'glow-cyan': '0 0 30px rgba(6,182,212,0.35)',
        'glow-pink': '0 0 30px rgba(236,72,153,0.35)',
        'card': '0 8px 32px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'grad-purple-pink': 'linear-gradient(135deg, #8B5CF6, #EC4899)',
        'grad-cyan-purple': 'linear-gradient(135deg, #06B6D4, #8B5CF6)',
      },
    },
  },
  plugins: [],
}