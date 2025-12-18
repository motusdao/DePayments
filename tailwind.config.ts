/**  @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#635BFF',
        secondary: '#00F5C4',
        dark: '#0B0F19',
        surface: '#1F2733',
        textPrimary: '#F3F4F6',
        alert: '#FF6B6B',
        info: '#89CFF0',
        border: '#3A3F51',
      },
    },
  },
  plugins: [],
}; 
 