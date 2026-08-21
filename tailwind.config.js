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
        background: '#F8FAFC', // Slate-50 clean academic background
        surface: {
          50: '#FFFFFF',
          100: '#FFFFFF', // Pure White Card
          200: '#F1F5F9', // Very light gray section
          300: '#E2E8F0', // Thin border / divider
          400: '#CBD5E1',
          500: '#64748B',
        },
        chem: {
          50: '#EFF6FF', // Light blue selected state
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB', // Primary Academic Blue
          600: '#1D4ED8',
          700: '#1E40AF',
          emerald: '#16A34A', // Subtle Green
          amber: '#EA580C',   // Soft Orange Warning
          rose: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'card': '12px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'dropdown': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      },
      borderWidth: {
        'thin': '1px',
      }
    },
  },
  plugins: [],
}
