import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class', // enable class-based dark mode
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Map Tailwind color names to CSS custom properties defined in globals.css
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        subtle: 'var(--bg-subtle)',
        "border-default": 'var(--border-default)',
        "border-subtle": 'var(--border-subtle)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        faint: 'var(--text-faint)',
        "accent-primary": 'var(--accent-primary)',
        "accent-primary-dim": 'var(--accent-primary-dim)',
        "accent-ai": 'var(--accent-ai)',
        "accent-ai-text": 'var(--accent-ai-text)',
        error: 'var(--state-error)',
        success: 'var(--state-success)',
        warning: 'var(--state-warning)',
      },
    },
  },
  plugins: [],
};

export default config;
