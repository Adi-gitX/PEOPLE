/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Stack Sans Notch"', '-apple-system', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        background: '#000000',
        foreground: '#ffffff',
        accent: {
          DEFAULT: '#ffffff',
          foreground: '#000000',
        },
        muted: {
            DEFAULT: '#111111',
            foreground: '#888888',
        },
        border: '#222222',
      }
    },
  },
  plugins: [],
}
