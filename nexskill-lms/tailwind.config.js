/** @type {import('tailwindcss').Config} */
export default {
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
    },
  },
  plugins: [],
}
