/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        colors: {
          primary: '#2563eb',
          secondary: '#7c3aed',
          accent: '#f59e0b',
          danger: '#ef4444',
          success: '#10b981',
          surface: '#f8fafc',
      },
    },
  },
  plugins: [],
}