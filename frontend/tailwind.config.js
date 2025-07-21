export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Scans all your source files
  ],
  variants: {
        extend: {
          placeholderColor: ['dark'],
          placeholderOpacity: ['dark'],
        },
      },
  theme: {
    extend: {
      // We are using CSS variables for theming from index.css,
      // but you can extend colors, fonts, etc. here if needed.
      animation: {
        slideRight : "slideRight 9s infinite",
        slideLeft: "slideLeft 7s infinite",
        'slow-spin-fall': 'slowSpinFall 5s infinite',
        slideLeftSlow : "slideLeftSlow 5s infinite",
        'slow-bounce': 'bounce 5s infinite',
        marquee: "marquee var(--duration) linear infinite",
        "marquee-vertical": "marquee-vertical var(--duration) linear infinite",
        "slow-spin" : "spin 5s linear infinite",

      },
      keyframes: {
        slideLeftSlow: {
          '0%': { transform: 'translateX(-10px) ' },
          '50%': { transform: 'translateX(10px) ' },
          '100%': { transform: 'translateX(-10px)' },
        },
        slowSpinFall: {
          '0%': { transform: 'translateY(10px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(-15deg) scale(1.1)' },
          '100%': { transform: 'translateY(10px) rotate(0deg)' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-200px) scale(1)' },
          '50%': { transform: 'translateX(0px) scale(1.1)' },
          '100%': { transform: 'translateX(-200px) scale(1)' },
          
        },
        slideLeft: {
          '0%': { transform: 'translateX(200px) scale(1)' },
          '50%': { transform: 'translateX(0px) scale(1.1)' },
          '100%': { transform: 'translateX(200px) scale(1)' },
          
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        "marquee-vertical": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(calc(-100% - var(--gap)))" },
        },
      },

      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
    },
  },
  plugins: [],
}