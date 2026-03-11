/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#F5F3EF',
        sidebar: '#1a1a1a',
        'dark-surface': '#2a2a2a',
        card: '#E8E4DC',
        accent: '#C05A3C',
        'border-light': '#D1CCC4',
        'border-dark': '#3a3a3a',
        'text-primary': '#1a1a1a',
        'text-secondary': '#555555',
        'text-tertiary': '#666666',
        'text-muted': '#888888',
        'text-on-dark': '#F5F3EF',
        success: '#4A7C59',
        warning: '#C05A3C',
        error: '#B54A4A',
        info: '#5C7C8A',
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
