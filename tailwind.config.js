/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Blue (Enterprise)
        'primary': '#0066CC',
        'primary-dark': '#0052A3',
        
        // Neutral palette (Slate)
        'slate': {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        
        // Semantic colors
        'success': '#10B981',
        'warning': '#F59E0B',
        'error': '#EF4444',
        'info': '#3B82F6',
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
