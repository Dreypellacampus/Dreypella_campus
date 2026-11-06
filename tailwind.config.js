/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F0F3FA',
          100: '#DCE3F3',
          200: '#B5C3E3',
          300: '#7F95C9',
          400: '#4A64A6',
          500: '#1F3A7A',
          600: '#133066',
          700: '#0E2556',
          800: '#0B1F63',
          900: '#081B5A',
          DEFAULT: '#081B5A',
        },
        mist: '#F5F7FA',
        red: {
          50: '#FDF0F0',
          100: '#FAD6D8',
          200: '#F5A9AD',
          400: '#EE4B52',
          500: '#E31B23',
          600: '#C4161D',
          700: '#A11218',
          DEFAULT: '#E31B23',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s ease-out both',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
