/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Excellon DS typography: Noto Sans (UI), Poppins (display), Inter (data).
        sans: ['Noto Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['Strawford', 'Poppins', 'sans-serif'],
        data: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      colors: {
        // Brand — Excellon warm orange
        'primary': '#eb6a2c',
        'primary-dark': '#c44b1b',

        // Neutral palette — Excellon DS cool slate ramp
        'slate': {
          50: '#f4f7fa',
          100: '#eff2f5',
          200: '#dee4eb',
          300: '#c3ccd6',
          400: '#a8b5c2',
          500: '#8593a3',
          600: '#6a7682',
          700: '#505862',
          800: '#353b41',
          900: '#1b1d21',
        },

        // Semantic colors — Excellon DS
        'success': '#52c41a',
        'warning': '#ffab00',
        'error': '#f5222d',
        'info': '#3697ff',
      },
      spacing: {
        '0.5': '0.125rem',  // 2px
        '1': '0.25rem',     // 4px (micro)
        '1.5': '0.375rem',  // 6px
        '2': '0.5rem',      // 8px (compact)
        '3': '0.75rem',     // 12px (small)
        '4': '1rem',        // 16px (default)
        '6': '1.5rem',      // 24px (section)
        '8': '2rem',        // 32px (large section)
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#334155',
            fontSize: '14px',
            lineHeight: '1.5',
          }
        }
      },
      borderRadius: {
        'sm': '4px',
        'base': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'base': '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.10)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.10)',
      },
    },
  },
  plugins: [],
}
