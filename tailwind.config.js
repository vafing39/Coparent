/**
 * Les couleurs pointent vers des variables CSS fournies par src/theme/ThemeProvider.tsx
 * à partir de src/theme/tokens.ts : clair/sombre sans classe `dark:`.
 * Les tailles et espacements reprennent les jetons du design system.
 */
const colorNames = [
  'primary',
  'primary-soft',
  'on-primary',
  'accent',
  'on-accent',
  'parent-a',
  'parent-a-soft',
  'parent-b',
  'parent-b-soft',
  'background',
  'surface',
  'card',
  'border',
  'text-secondary',
  'text',
  'shared',
  'validated',
  'pending',
  'error',
  'avatar-rose',
  'avatar-rose-ink',
  'avatar-olive',
  'avatar-olive-ink',
  'avatar-prune',
  'avatar-prune-ink',
  'avatar-warmgray',
  'avatar-warmgray-ink',
];

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    // Remplace la palette Tailwind : seules les couleurs du design system existent.
    colors: {
      transparent: 'transparent',
      ...Object.fromEntries(
        colorNames.map(name => [
          name,
          `rgb(var(--color-${name}) / <alpha-value>)`,
        ]),
      ),
    },
    extend: {
      fontFamily: {
        regular: ['Nunito-Regular'],
        semibold: ['Nunito-SemiBold'],
        bold: ['Nunito-Bold'],
        extrabold: ['Nunito-ExtraBold'],
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
        lg: '24px',
        full: '999px',
      },
      minHeight: {
        'tap-target': '48px',
      },
    },
  },
  plugins: [],
};
