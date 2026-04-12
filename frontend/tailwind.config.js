/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e2a38', // Deep Navy
          light: '#2c3e50',
        },
        accent: {
          DEFAULT: '#5fa8d3', // Soft Blue
          light: '#eaf1f8',
          glow: 'rgba(95, 168, 211, 0.15)',
        },
        surface: {
          DEFAULT: '#f4f7fb', // Background
          card: 'rgba(255, 255, 255, 0.75)',
        },
        text: {
          heading: '#2c3e50',
          muted: '#7b8a97',
        },
        success: '#6fcf97',
        warning: '#f2c94c',
        danger: '#eb5757',
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '30px',
      },
      boxShadow: {
        'soft': '0 8px 25px rgba(0, 0, 0, 0.05)',
        'premium': '0 12px 35px rgba(0, 0, 0, 0.08)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
    },
  },
  plugins: [],
}
