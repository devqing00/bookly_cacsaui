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
          50: '#fafaf9',   // Warm off-white
          100: '#f5f5f4',  // Lighter stone
          150: '#eeeeec',  // Custom stone
          200: '#e7e5e4',  // Stone border
          300: '#d6d3d1',  // Medium stone
          400: '#a8a29e',  // Muted stone
          500: '#78716c',  // Mid stone
          600: '#57534e',  // Dark stone
          700: '#44403c',  // Deeper stone
          800: '#292524',  // Rich charcoal
          900: '#1c1917',  // Deep charcoal (not pure black)
          950: '#0c0a09',  // Darkest charcoal
        },
        green: {
          50: '#f0fdf5',   // Lightest mint
          100: '#dcfce8',  // Light mint
          200: '#bbf7d1',  // Soft green
          300: '#86efac',  // Light green
          400: '#4ade80',  // Fresh green
          500: '#22c55e',  // Vibrant green (primary accent)
          600: '#16a34a',  // Forest green
          700: '#15803d',  // Deep green
          800: '#166534',  // Dark forest
          900: '#14532d',  // Deepest green
          950: '#052e16',  // Nearly black green
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
