import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // enable class-based dark mode
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map Tailwind color names to CSS custom properties defined in globals.css
        base: "var(--color-bg-base)",
        surface: "var(--color-bg-surface)",
        elevated: "var(--color-bg-elevated)",
        subtle: "var(--color-bg-subtle)",
        "border-default": "var(--color-border-default)",
        "border-subtle": "var(--color-border-subtle)",
        primary: "var(--color-text-primary)",
        secondary: "var(--color-text-secondary)",
        muted: "var(--color-text-muted)",
        faint: "var(--color-text-faint)",
        "accent-primary": "var(--color-accent-primary)",
        "accent-primary-dim": "var(--color-accent-primary-dim)",
        "accent-ai": "var(--color-accent-ai)",
        "accent-ai-text": "var(--color-accent-ai-text)",
        error: "var(--color-state-error)",
        success: "var(--color-state-success)",
        warning: "var(--color-state-warning)",
      },
    },
  },
  plugins: [],
};

export default config;
