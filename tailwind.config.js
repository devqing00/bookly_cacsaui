/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neutral: {
          50: '#fefcf7',   // Warm cream
          100: '#fdf9f0',  // Light cream
          150: '#faf6e8',  // Custom cream
          200: '#f5f0e0',  // Beige
          300: '#e8dfc8',  // Warm beige
          400: '#d9c3a9',  // Medium beige
          500: '#b89968',  // Tan
          600: '#997a4f',  // Warm tan
          700: '#7a5f3e',  // Brown
          800: '#5c4530',  // Deep brown
          900: '#3d2e20',  // Rich brown
          950: '#1c1917',  // Deep charcoal
        },
        golden: {
          50: '#fcf7e8',   // Lightest golden
          100: '#faf1d5',  // Light golden cream
          200: '#f7e6ab',  // Soft golden
          300: '#f3d881',  // Light golden
          400: '#efc957',  // Bright golden
          500: '#d4a244',  // Primary golden/mustard (from flyer)
          600: '#b8862f',  // Deep golden
          700: '#9c6d23',  // Darker golden
          800: '#7d5619',  // Bronze
          900: '#5e3f10',  // Deep bronze
          950: '#3f2a08',  // Nearly black bronze
        },
        burgundy: {
          50: '#fdf5f5',   // Lightest burgundy tint
          100: '#fae8e8',  // Light burgundy
          200: '#f3d1d1',  // Soft burgundy
          300: '#e8b4b4',  // Light burgundy rose
          400: '#d68888',  // Muted burgundy
          500: '#a85050',  // Medium burgundy
          600: '#8a3a3a',  // Rich burgundy
          700: '#5c2a2a',  // Primary burgundy/maroon (from flyer)
          800: '#4a1f1f',  // Dark burgundy (from flyer)
          900: '#3a1616',  // Deepest burgundy
          950: '#2a0f0f',  // Nearly black burgundy
        },
        red: {
          50: '#fef2f2',   // Lightest red
          100: '#fee2e2',  // Light red
          200: '#fecaca',  // Soft red
          300: '#fca5a5',  // Light red
          400: '#f87171',  // Bright red
          500: '#dc2626',  // Red accent (from heart balloons)
          600: '#b91c1c',  // Deep red
          700: '#991b1b',  // Darker red
          800: '#7f1d1d',  // Dark red
          900: '#651c1c',  // Deepest red
          950: '#450a0a',  // Nearly black red
        },
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'soft': '0 2px 8px 0 rgb(0 0 0 / 0.08)',
        'medium': '0 4px 16px 0 rgb(0 0 0 / 0.12)',
      },
    },
  },
  plugins: [],
}
