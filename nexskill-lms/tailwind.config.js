/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#304DB5',
          'primary-light': '#5E7BFF',
          'primary-soft': '#E0E5FF',
          'primary-dark': '#152457',
        },
        background: {
          'app-outer': '#E8ECFD',
          shell: '#FFFFFF',
          card: '#FFFFFF',
          'card-tinted': '#E8EEFF',
        },
        text: {
          primary: '#111827',
          secondary: '#5F6473',
          muted: '#9CA3B5',
          inverse: '#FFFFFF',
          link: '#304DB5',
        },
        dark: {
          background: {
            'app-outer': '#0F172A',
            shell: '#1E293B',
            card: '#1E293B',
            'card-tinted': '#334155',
          },
          text: {
            primary: '#F1F5F9',
            secondary: '#CBD5E1',
            muted: '#94A3B8',
            inverse: '#0F172A',
          },
        },
      },
      borderRadius: {
        'shell': '32px',
        'card': '24px',
      },
      boxShadow: {
        'card': '0 18px 45px rgba(15, 35, 95, 0.08)',
        'button-primary': '0 12px 24px rgba(35, 76, 200, 0.35)',
        'floating-chip': '0 12px 30px rgba(20, 46, 130, 0.12)',
      },
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-in-out',
        scaleIn: 'scaleIn 0.2s ease-in-out',
      },
    },
  },
  plugins: [],
}
