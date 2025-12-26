/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Stack Sans Notch"', '-apple-system', 'system-ui', '"Segoe UI"', 'sans-serif'],
        display: ['"Stack Sans Notch"', '-apple-system', 'system-ui', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        background: '#000000',
        foreground: '#ffffff',
        card: '#0A0A0A',
        'card-foreground': '#ffffff',
        popover: '#0A0A0A',
        'popover-foreground': '#ffffff',
        primary: {
          DEFAULT: '#ffffff',
          foreground: '#000000',
        },
        secondary: {
          DEFAULT: '#27272a',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#27272a',
          foreground: '#a1a1aa', // Zinc 400
        },
        accent: {
          DEFAULT: '#27272a',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        border: '#27272a',
        input: '#27272a',
        ring: '#ffffff',
      }
    },
  },
  plugins: [],
}
