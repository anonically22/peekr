/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './sidepanel.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#0D0D0F',
        surface: '#1A1A1F',
        accent: '#00FF88',
        danger: '#FF4D4D',
        text: '#F0F0F0',
        muted: '#666672',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
