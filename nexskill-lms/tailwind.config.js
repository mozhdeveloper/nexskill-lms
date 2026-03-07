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
          neon: 'var(--color-brand-neon)',
          electric: 'var(--color-brand-electric)',
          primary: 'var(--color-brand-primary)',
          'primary-soft': 'rgba(48, 77, 181, 0.08)',
        },
        background: {
          app: 'var(--color-bg-app)',
          shell: 'var(--color-bg-shell)',
          card: 'var(--color-bg-card)',
          sidebar: 'var(--color-bg-sidebar)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        dark: {
          background: {
            shell: 'var(--color-bg-shell)',
            card: 'var(--color-bg-card)',
          },
          text: {
            primary: 'var(--color-text-primary)',
            secondary: 'var(--color-text-secondary)',
            muted: 'var(--color-text-muted)',
          },
        },
      },
      backgroundImage: {
        'gradient-master': 'var(--gradient-master)',
      },
      borderRadius: {
        'shell': '32px',
        'card': '24px',
      },
      boxShadow: {
        'card': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glow': '0 0 15px rgba(34, 197, 94, 0.5)',
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
