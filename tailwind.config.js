/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0f0f0f',
        'bg-surface': '#1a1a1a',
        'bg-elevated': '#242424',
        accent: '#00e676',
        'accent-dim': '#00c853',
        danger: '#ff5252',
        'text-secondary': '#a0a0a0',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}

