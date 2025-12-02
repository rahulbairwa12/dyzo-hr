/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js",
  ],
  mode: "jit",
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "15px",
        sm: "15px",
        lg: "15px",
        xl: "0",
        "2xl": "0",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        primary: {
          50: "#F6F8FF",
          100: "#EDF0FF",
          200: "#D1DAFE",
          300: "#B4C2FD",
          400: "#8092FF",
          500: "#4669fa",
          600: "#3F5EDF",
          700: "#2A3F96",
          800: "#203071",
          900: "#151F49",
        },
        secondary: {
          50: "#F9FAFB",
          100: "#F4F5F7",
          200: "#E5E7EB",
          300: "#D2D6DC",
          400: "#9FA6B2",
          500: "#A0AEC0",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        danger: {
          50: "#FFF7F7",
          100: "#FEEFEF",
          200: "#FCD6D7",
          300: "#FABBBD",
          400: "#F68B8D",
          500: "#F1595C",
          600: "#D75052",
          700: "#913638",
          800: "#6D292A",
          900: "#461A1B",
        },
        black: {
          50: "#F9FAFB",
          100: "#F4F5F7",
          200: "#E5E7EB",
          300: "#D2D6DC",
          400: "#9FA6B2",
          500: "#111112",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        warning: {
          50: "#FFFAF8",
          100: "#FFF4F1",
          200: "#FEE4DA",
          300: "#FDD2C3",
          400: "#FCB298",
          500: "#FA916B",
          600: "#DF8260",
          700: "#965741",
          800: "#714231",
          900: "#492B20",
        },
        info: {
          50: "#F3FEFF",
          100: "#E7FEFF",
          200: "#C5FDFF",
          300: "#A3FCFF",
          400: "#5FF9FF",
          500: "#0CE7FA",
          600: "#00B8D4",
          700: "#007A8D",
          800: "#005E67",
          900: "#003F42",
        },
        success: {
          50: "#F3FEF8",
          100: "#E7FDF1",
          200: "#C5FBE3",
          300: "#A3F9D5",
          400: "#5FF5B1",
          500: "#50C793",
          600: "#3F9A7A",
          700: "#2E6D61",
          800: "#1F4B47",
          900: "#0F2A2E",
        },
        gray: {
          50: "#F9FAFB",
          100: "#F4F5F7",
          200: "#E5E7EB",
          300: "#D2D6DC",
          400: "#9FA6B2",
          500: "#68768A",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        customGreen: {
          50: "#30F558",
        },
        electricBlue: {
          50: '#8E2EFF',
          100: "#7A39FF",
        },
        customWhite: {
          50: '#F5F4F3',
          100: '#F9F8F8',
        },
        customGray: {
          50: '#747474',
          100: '#9D9D9D',
          150: '#B8B8B8',
          200: '#565557',
          250: '#A2A0A2',
          300: "#5C5C5C",
          400: "#EDEDED",
        },
        customPurple: {
          50: "#E8E5F9",
          100: "#F6F5FD",
          150: "#F4F1FF"
        },
        neutral: {
          50: '#E1E1E1',
          100: '#DEDEDE',
          150: '#F0F0F0',
          200: '#A1A1A1',
          250: '#f5f3ff',
          300: '#A2A2A2',
          400: '#F6F5FD',
        },
        customBlack: {
          50: '#000000',
          100: '#313131',
          200: '#4C4C4C',
          300: '#2E2E30',
          400: '#1E1F21',
        },
        customRed: {
          50: '#FF2E2E',
        },
        customOrange: {
          50: '#FF7700',
        },
        customGreen: {
          50: '#038E00',
          100: '#1AB631',
        },
        customRed: {
          50: '#F24646',
        },
        favStar: {
          100:"#1993dd"
        }
      },

      fontFamily: {
        inter: ["Inter", "sans-serif"],
        lato: ["Lato", "sans-serif"],
      },
      boxShadow: {
        base: "0px 0px 1px rgba(40, 41, 61, 0.08), 0px 0.5px 2px rgba(96, 97, 112, 0.16)",
        base2:
          "0px 2px 4px rgba(40, 41, 61, 0.04), 0px 8px 16px rgba(96, 97, 112, 0.16)",
        base3: "16px 10px 40px rgba(15, 23, 42, 0.22)",
        deep: "-2px 0px 8px rgba(0, 0, 0, 0.16)",
        dropdown: "0px 4px 8px rgba(0, 0, 0, 0.08)",

        testi: "0px 4px 24px rgba(0, 0, 0, 0.06)",
        todo: "rgba(235 233 241, 0.6) 0px 3px 10px 0px",
      },
      keyframes: {
        zoom: {
          "0%, 100%": { transform: "scale(0.5)" },
          "50%": { transform: "scale(1)" },
        },
        tada: {
          "0%": { transform: "scale3d(1, 1, 1)" },
          "10%, 20%": {
            transform: "scale3d(1, 1, 0.95) rotate3d(0, 0, 1, -10deg)",
          },
          "30%, 50%, 70%, 90%": {
            transform: "scale3d(1, 1, 1) rotate3d(0, 0, 1, 10deg)",
          },
          "40%, 60%, 80%": {
            transform: "rotate3d(0, 0, 1, -10deg)",
          },
          "100%": { transform: "scale3d(1, 1, 1)" },
        },
        bouncing: {
          '0%, 100%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '25%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.6, 0.05, 0.2, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0.6, 0.05, 0.2, 1)',
          },
          '75%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.6, 0.05, 0.2, 1)',
          },
        },

      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        zoom: "zoom 1s ease-in-out infinite",
        tada: "tada 1.5s ease-in-out infinite",
        bouncing: 'bouncing 1.2s infinite',
      },
    },
  },
  plugins: [],
};