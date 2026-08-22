/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: '#F5F5FB',
        surface: '#FFFFFF',
        ink: '#0F172A',
        muted: '#64748B',
        line: '#E7E8F0',
        brand: {
          DEFAULT: '#4F46E5',
          600: '#4338CA',
          700: '#3730A3',
        },
        good: '#16A34A',
        goodbg: '#DCFCE7',
        bad: '#DC2626',
        badbg: '#FEE2E2',
        warn: '#D97706',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -12px rgba(16,24,40,0.12)',
        hero: '0 20px 40px -16px rgba(79,70,229,0.55)',
      },
      borderRadius: {
        xl2: '20px',
        xl3: '26px',
      },
    },
  },
  plugins: [],
}
