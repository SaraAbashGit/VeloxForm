import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette: #191918 (ink), #294248 (deep teal), #64ccd0 (cyan), #879983 (sage)
        // Contrast: cyan takes ink text, never white; cyan/sage are never text on white (use cyan-700)
        brand: {
          50: '#e3f6f6', // cyan tint: selected states
          100: '#879983', // sage: secondary text on dark, decorative
          500: '#294248', // deep teal: text, icons, secondary surfaces
          600: '#191918', // ink: brand frame (sidebar, hero)
          900: '#191918',
          ink: '#191918',
          teal: '#294248',
          cyan: { DEFAULT: '#64ccd0', hover: '#4fbfc4', 50: '#e3f6f6', 700: '#1a7478' },
          sage: { DEFAULT: '#879983', 50: '#eef1ec' },
        },
        surface: '#f6f7f5',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        sans: ['var(--font-heebo)', 'sans-serif'],
        display: ['var(--font-rubik)', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
