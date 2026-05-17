/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        paper: '#ffffff',
        critical: '#FF1F1F',
        high: '#FF6A00',
        medium: '#F5C518',
        low: '#2563EB',
        success: '#00C853',
        muted: 'rgba(0,0,0,0.60)',
        divider: 'rgba(0,0,0,0.15)',
        'divider-strong': 'rgba(0,0,0,0.30)',
      },
      borderWidth: {
        hero: '3px',
      },
      letterSpacing: {
        eyebrow: '0.18em',
      },
      fontFamily: {
        display: ['SpaceGrotesk_700Bold', 'System'],
        mono: ['JetBrainsMono_400Regular', 'monospace'],
        'mono-bold': ['JetBrainsMono_700Bold', 'monospace'],
      },
    },
  },
  plugins: [],
};
