/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: 'rgb(var(--c-void) / <alpha-value>)',
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        panel: 'rgb(var(--c-panel) / <alpha-value>)',
        rail: 'rgb(var(--c-rail) / <alpha-value>)',
        edge: 'rgb(var(--c-edge) / <alpha-value>)',
        'edge-bright': 'rgb(var(--c-edge-bright) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        dim: 'rgb(var(--c-dim) / <alpha-value>)',
        cyan: 'rgb(var(--c-cyan) / <alpha-value>)',
        amber: 'rgb(var(--c-amber) / <alpha-value>)',
        risk: 'rgb(var(--c-risk) / <alpha-value>)',
        warn: 'rgb(var(--c-warn) / <alpha-value>)',
        good: 'rgb(var(--c-good) / <alpha-value>)',
        locA: 'rgb(var(--c-cyan) / <alpha-value>)',
        locB: 'rgb(var(--c-amber) / <alpha-value>)',
        card: 'rgb(var(--c-panel) / <alpha-value>)',
        border: 'rgb(var(--c-edge) / <alpha-value>)',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['"Major Mono Display"', '"JetBrains Mono"', 'monospace'],
        sans: ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      letterSpacing: {
        'widest-plus': '0.2em',
      },
      borderRadius: {
        DEFAULT: '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '14px',
      },
      boxShadow: {
        panel: '0 0 0 1px rgb(var(--c-cyan) / 0.12), 0 8px 32px rgb(var(--c-void) / 0.6)',
        'panel-strong': '0 0 0 1px rgb(var(--c-cyan) / 0.25), 0 12px 48px rgb(var(--c-void) / 0.8)',
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'reveal': 'reveal 0.4s ease-out forwards',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
        'reveal': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
