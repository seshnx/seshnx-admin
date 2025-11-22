/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'admin-dark': '#0f1115',
        'admin-card': '#181b21',
        'admin-accent': '#3D84ED',
        'danger': '#ef4444',
      },
      fontSize: {
        'xxs': '0.65rem', // Ultra small for high density
      }
    },
  },
  plugins: [],
}
