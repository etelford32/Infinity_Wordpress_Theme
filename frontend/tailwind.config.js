/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark-cosmic"]', '[data-theme="science-dark"]'],
  theme: {
    extend: {
      colors: {
        // Dark Cosmic Theme
        'cosmic-bg': {
          primary: '#0a0e1a',
          secondary: '#141824',
          tertiary: '#1e2330',
        },
        'cosmic-text': {
          primary: '#ffffff',
          secondary: '#b8c0d4',
          tertiary: '#7a8199',
        },
        'cosmic-accent': {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          tertiary: '#06b6d4',
        },

        // Light Playful Theme
        'playful-bg': {
          primary: '#fef3f2',
          secondary: '#fff7ed',
          tertiary: '#ffffff',
        },
        'playful-text': {
          primary: '#1e1b4b',
          secondary: '#4c1d95',
          tertiary: '#6b21a8',
        },
        'playful-accent': {
          primary: '#f472b6',
          secondary: '#fb923c',
          tertiary: '#fbbf24',
        },

        // Science Light Theme
        'science-light-bg': {
          primary: '#f8fafc',
          secondary: '#f1f5f9',
          tertiary: '#e2e8f0',
        },
        'science-light-text': {
          primary: '#0f172a',
          secondary: '#334155',
          tertiary: '#64748b',
        },
        'science-light-accent': {
          primary: '#3b82f6',
          secondary: '#06b6d4',
          tertiary: '#8b5cf6',
        },

        // Science Dark Theme
        'science-dark-bg': {
          primary: '#0f172a',
          secondary: '#1e293b',
          tertiary: '#334155',
        },
        'science-dark-text': {
          primary: '#f8fafc',
          secondary: '#cbd5e1',
          tertiary: '#94a3b8',
        },
        'science-dark-accent': {
          primary: '#60a5fa',
          secondary: '#22d3ee',
          tertiary: '#a78bfa',
        },

        // Semantic colors
        nebula: '#7c3aed',
        star: '#fbbf24',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'Monaco',
          '"Cascadia Code"',
          '"Roboto Mono"',
          'Consolas',
          '"Courier New"',
          'monospace',
        ],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(99, 102, 241, 0.3)',
        'glow-md': '0 0 20px rgba(99, 102, 241, 0.5)',
        'glow-lg': '0 0 30px rgba(99, 102, 241, 0.7)',
      },
    },
  },
  plugins: [],
};
