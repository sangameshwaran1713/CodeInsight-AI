/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // User requested color combination: #C0B283 (Gold/Champagne) & #f3f0e6 (Ivory/Cream)
        primary: {
          50: '#faf8f3',
          100: '#f3f0e6', // User Ivory Cream
          200: '#e6dfcd',
          300: '#d5caa7',
          400: '#d1c397',
          500: '#C0B283', // User Warm Gold / Brass Accent
          600: '#a89767',
          700: '#8a7b50',
          800: '#6b5f3d',
          900: '#4d432b',
          950: '#1c180e',
        },
        gold: {
          400: '#d1c397',
          500: '#C0B283',
          600: '#a89767',
        },
        ivory: {
          50: '#ffffff',
          100: '#f3f0e6',
          200: '#e7e2d2',
        },
        accent: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        dark: {
          50: '#f8fafc',
          100: '#f3f0e6', // Ivory Light mode
          200: '#e5e1d4',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#26221a',
          800: '#191610',
          900: '#120f0a',
          950: '#0b0906', // Rich Gold Obsidian
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 25px -5px rgba(192, 178, 131, 0.45)',
        'glow-gold': '0 0 25px -5px rgba(192, 178, 131, 0.5)',
        'glow-accent': '0 0 25px -5px rgba(139, 92, 246, 0.4)',
        'glow-cyan': '0 0 25px -5px rgba(34, 211, 238, 0.4)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'gradient': 'gradient 8s ease infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        glow: {
          'from': { boxShadow: '0 0 10px rgba(192, 178, 131, 0.25), 0 0 20px rgba(192, 178, 131, 0.15)' },
          'to': { boxShadow: '0 0 25px rgba(192, 178, 131, 0.55), 0 0 45px rgba(192, 178, 131, 0.3)' },
        },
        gradient: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        }
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
};


