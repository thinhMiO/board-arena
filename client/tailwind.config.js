/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../shared/**/*.{js,ts}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        arena: {
          900: '#0b0f19',
          800: '#111827',
          700: '#1e293b',
          600: '#334155',
          gold: '#f59e0b',
          goldLight: '#fbbf24',
          accent: '#3b82f6',
          ruby: '#ef4444',
          emerald: '#10b981'
        }
      },
      gridTemplateRows: {
        '7': 'repeat(7, minmax(0, 1fr))',
        '8': 'repeat(8, minmax(0, 1fr))',
        '9': 'repeat(9, minmax(0, 1fr))',
        '10': 'repeat(10, minmax(0, 1fr))',
        '12': 'repeat(12, minmax(0, 1fr))',
        '15': 'repeat(15, minmax(0, 1fr))',
        '19': 'repeat(19, minmax(0, 1fr))',
      },
      gridTemplateColumns: {
        '15': 'repeat(15, minmax(0, 1fr))',
        '19': 'repeat(19, minmax(0, 1fr))',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(245, 158, 11, 0.4)' },
          '100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.9)' }
        }
      }
    },
  },
  plugins: [],
}
