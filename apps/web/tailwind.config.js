/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 6px 20px -6px rgba(15, 23, 42, 0.06)',
        'card-dark': '0 1px 2px rgba(0, 0, 0, 0.35), 0 10px 24px -8px rgba(0, 0, 0, 0.45)',
        float: '0 16px 40px -12px rgba(15, 23, 42, 0.22)',
      },
    },
  },
  plugins: [],
};
