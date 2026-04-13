/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: '#06080f',
        bg: '#080b15',
        panel: '#0d121e',
        rail: '#0a0e18',
        edge: '#1a2338',
        'edge-bright': '#2d3a55',
        ink: '#e8eef5',
        muted: '#6a768b',
        dim: '#3d4759',
        cyan: '#7eeaff',
        amber: '#ffb347',
        risk: '#ff4d5e',
        warn: '#ffb347',
        good: '#66ffa3',
        locA: '#7eeaff',
        locB: '#ffb347',
        card: '#0d121e',
        border: '#1a2338',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['"Major Mono Display"', '"JetBrains Mono"', 'monospace'],
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      letterSpacing: {
        'widest-plus': '0.2em',
      },
      boxShadow: {
        hud: '0 0 0 1px rgba(126,234,255,0.12), 0 8px 32px rgba(0,0,0,0.6)',
        'hud-strong': '0 0 0 1px rgba(126,234,255,0.25), 0 12px 48px rgba(0,0,0,0.8)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(126,234,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(126,234,255,0.04) 1px, transparent 1px)',
        'scan-line':
          'repeating-linear-gradient(0deg, rgba(126,234,255,0.02) 0px, rgba(126,234,255,0.02) 1px, transparent 1px, transparent 3px)',
      },
      backgroundSize: {
        'grid-sm': '24px 24px',
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'scan': 'scan 6s linear infinite',
        'reveal': 'reveal 0.4s ease-out forwards',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
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
