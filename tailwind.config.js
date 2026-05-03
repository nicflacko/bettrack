/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Inter',
          'Segoe UI',
          'sans-serif',
        ],
      },
      colors: {
        apple: {
          blue:   '#007AFF',
          green:  '#34C759',
          red:    '#FF3B30',
          orange: '#FF9F0A',
          purple: '#AF52DE',
          teal:   '#5AC8FA',
          indigo: '#5856D6',
        },
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.06)',
        modal: '0 24px 80px rgba(0,0,0,0.18)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
