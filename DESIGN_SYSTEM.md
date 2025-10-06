# 🎨 Minimalist Design System

## Design Philosophy

This application follows a **neutral, minimalistic, and refined** design approach that emphasizes:

- **Simplicity**: Clean lines, generous whitespace, and purposeful elements
- **Neutrality**: Monochromatic palette with grays and blacks as primary colors
- **Legibility**: Strong typography hierarchy with excellent readability
- **Subtlety**: Gentle animations and micro-interactions
- **Accessibility**: High contrast ratios and clear visual hierarchy

---

## Color Palette

### Neutral Colors (Light Mode)
```
neutral-50:  #fafafa  - Subtle background
neutral-100: #f5f5f5  - Card background alternative
neutral-200: #e5e5e5  - Borders
neutral-300: #d4d4d4  - Secondary borders
neutral-400: #a3a3a3  - Disabled text
neutral-500: #737373  - Muted text
neutral-600: #525252  - Secondary text
neutral-700: #404040  - Body text
neutral-800: #262626  - Headings
neutral-900: #171717  - Primary text, buttons
neutral-950: #0a0a0a  - Pure black elements
```

### Dark Mode Colors
The design automatically adapts to dark mode using the same neutral scale:
- Background: `neutral-950` (#0a0a0a)
- Cards: `neutral-900` (#171717)
- Borders: `neutral-800` (#262626)
- Text: `neutral-50` (#fafafa)

### Usage Guidelines
- **Primary Actions**: `neutral-900` (light) / `neutral-50` (dark)
- **Backgrounds**: `neutral-50` (light) / `neutral-950` (dark)
- **Cards**: `white` (light) / `neutral-900` (dark)
- **Borders**: `neutral-200` (light) / `neutral-800` (dark)
- **Body Text**: `neutral-700` (light) / `neutral-300` (dark)
- **Headings**: `neutral-900` (light) / `neutral-50` (dark)

---

## Typography

### Font Stack
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Type Scale
```
4xl: 2.25rem / 2.5rem    - Hero headings
3xl: 1.875rem / 2.25rem  - Page titles
2xl: 1.5rem / 2rem       - Section headings
xl:  1.25rem / 1.75rem   - Card titles
lg:  1.125rem / 1.75rem  - Subheadings
base: 1rem / 1.5rem      - Body text
sm:  0.875rem / 1.25rem  - Secondary text
xs:  0.75rem / 1rem      - Labels, captions
```

### Font Weights
- **Bold (700)**: Large headings, emphasis
- **Semibold (600)**: Card titles, button text
- **Medium (500)**: Labels, secondary headings
- **Regular (400)**: Body text, descriptions

### Letter Spacing
- **Tight**: `-0.025em` - Large display text
- **Normal**: `0` - Body text
- **Wide**: `0.025em` - Labels
- **Widest**: `0.1em` - Uppercase labels

---

## Layout & Spacing

### Container Widths
- **Small Forms**: `max-w-md` (28rem / 448px)
- **Content**: `max-w-4xl` (56rem / 896px)
- **Dashboard**: `max-w-7xl` (80rem / 1280px)

### Spacing Scale (Tailwind)
```
1  = 0.25rem (4px)
2  = 0.5rem  (8px)
3  = 0.75rem (12px)
4  = 1rem    (16px)
6  = 1.5rem  (24px)
8  = 2rem    (32px)
10 = 2.5rem  (40px)
12 = 3rem    (48px)
16 = 4rem    (64px)
```

### Common Patterns
- **Card Padding**: `p-8` (32px) on mobile, `p-10` (40px) on desktop
- **Section Spacing**: `mb-8` (32px) between major sections
- **Form Fields**: `space-y-6` (24px) between inputs
- **Grid Gap**: `gap-6` (24px) for card grids

---

## Components

### Buttons

#### Primary Button
```tsx
className="bg-neutral-900 dark:bg-neutral-50 
           hover:bg-neutral-800 dark:hover:bg-neutral-200 
           text-white dark:text-neutral-900 
           font-medium py-3 px-4 rounded-md 
           transition-colors duration-150"
```

#### Secondary Button
```tsx
className="border border-neutral-300 dark:border-neutral-700 
           text-neutral-700 dark:text-neutral-300 
           hover:bg-neutral-50 dark:hover:bg-neutral-800 
           font-medium py-3 px-4 rounded-md 
           transition-colors duration-150"
```

### Cards

#### Standard Card
```tsx
className="bg-white dark:bg-neutral-900 
           border border-neutral-200 dark:border-neutral-800 
           rounded-lg p-8"
```

### Forms

#### Input Field
```tsx
className="block w-full px-4 py-3 
           border border-neutral-300 dark:border-neutral-700 
           focus:border-neutral-900 dark:focus:border-neutral-400 
           bg-white dark:bg-neutral-950 
           rounded-md 
           text-neutral-900 dark:text-neutral-50 
           placeholder-neutral-400 dark:placeholder-neutral-600 
           transition-colors duration-150 
           focus:outline-none focus:ring-0"
```

#### Label
```tsx
className="block text-xs font-medium 
           text-neutral-700 dark:text-neutral-300 
           mb-2 tracking-wide uppercase"
```

### Loading States

#### Spinner
```tsx
<div className="animate-spin rounded-full h-10 w-10 
                border-2 border-neutral-300 dark:border-neutral-700 
                border-t-neutral-900 dark:border-t-neutral-50">
</div>
```

---

## Animations

### Timing Functions
```css
ease-standard: cubic-bezier(0.22, 1, 0.36, 1)  /* Primary easing */
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)      /* Default */
```

### Duration
- **Fast**: 150ms - Hover states, simple transitions
- **Normal**: 300ms - Component transitions
- **Slow**: 400ms - Page transitions

### Common Patterns

#### Fade In Up
```tsx
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
```

#### Fade In
```tsx
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 0.3 }}
```

#### Scale In
```tsx
initial={{ scale: 0.8, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
```

---

## Borders & Shadows

### Border Radius
- **Small**: `rounded-md` (6px) - Buttons, inputs
- **Medium**: `rounded-lg` (8px) - Cards
- **Full**: `rounded-full` - Icons, badges

### Shadows (Minimal Use)
We primarily use borders instead of shadows for a flatter, more minimal look:
```css
/* Avoid heavy shadows */
shadow-soft: 0 2px 8px 0 rgb(0 0 0 / 0.08)

/* Prefer borders */
border border-neutral-200 dark:border-neutral-800
```

---

## Accessibility

### Contrast Ratios
All text meets WCAG AAA standards:
- **Large Text**: 4.5:1 minimum
- **Body Text**: 7:1 minimum
- **Interactive Elements**: Clear focus states

### Focus States
```css
*:focus-visible {
  outline: 2px solid rgb(23, 23, 23);
  outline-offset: 2px;
}
```

### Dark Mode
- Automatically adapts using `dark:` variants
- Maintains contrast ratios in both modes
- Uses system preference by default

---

## Best Practices

### Do's ✅
- Use generous whitespace
- Maintain consistent spacing rhythm
- Keep animations subtle and purposeful
- Use neutral colors as primary palette
- Ensure high contrast for text
- Follow established component patterns
- Use uppercase labels for hierarchy

### Don'ts ❌
- Avoid colorful gradients
- Don't use heavy shadows
- Avoid unnecessary decorative elements
- Don't mix multiple font families
- Avoid complex animations
- Don't ignore dark mode variants
- Avoid low contrast text

---

## Component Examples

### Registration Form
- Clean input fields with subtle borders
- Uppercase labels for structure
- Minimal error states (red accent)
- Large, clear submit button
- Subtle footer note

### Confirmation Display
- Large, centered checkmark icon
- Huge table number display (7xl font)
- Bordered information cards
- Bullet points with minimal dots
- Clear call-to-action button

### Admin Dashboard
- Grid layout with consistent cards
- Minimal progress bars (1px height)
- Left-bordered list items
- Stats cards with uppercase labels
- Subtle loading states

---

## Responsive Design

### Breakpoints
```css
sm: 640px   - Small tablets
md: 768px   - Tablets
lg: 1024px  - Laptops
xl: 1280px  - Desktops
```

### Mobile-First Approach
- Base styles for mobile
- Progressive enhancement for larger screens
- Touch-friendly tap targets (44px minimum)
- Readable font sizes at all breakpoints

---

## Code Conventions

### Class Ordering
1. Layout (display, position, flex)
2. Sizing (width, height, padding, margin)
3. Typography (font, text color)
4. Backgrounds & Borders
5. Effects (shadow, opacity, transform)
6. Transitions & Animations
7. Dark mode variants

### Example
```tsx
className="
  flex items-center justify-center
  w-full px-4 py-3
  text-sm font-medium text-white
  bg-neutral-900 border border-neutral-900 rounded-md
  hover:bg-neutral-800
  transition-colors duration-150
  dark:bg-neutral-50 dark:text-neutral-900
"
```

---

## Future Enhancements

### Potential Additions
- [ ] Custom focus ring color option
- [ ] Reduced motion preference support
- [ ] High contrast mode
- [ ] Additional neutral tones (neutral-150, etc.)
- [ ] Print styles
- [ ] RTL language support

---

## Resources

### Inspiration
- Apple Human Interface Guidelines
- Linear's design system
- Vercel's design language
- GitHub Primer

### Tools
- Tailwind CSS v3.4.13
- Motion (formerly Framer Motion) v10.18.0
- Next.js 15.5.4
- TypeScript 5.6.3

---

**Last Updated**: October 2025  
**Version**: 2.0 - Minimalist Redesign
