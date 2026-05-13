/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // 1. COLORS (Palet Cyberpunk)
      colors: {
        cyber: {
          black: "#050507",        // Deep void black
          dark: "#0f0f1a",         // Panel background
          darker: "#0a0a12",       // Slightly lighter
          cyan: "#00f5d4",         // Bright neon cyan
          cyanDim: "#00a896",      // Dimmed cyan
          purple: "#9d4edd",       // Vibrant purple
          purpleDim: "#7b2cbf",    // Dimmed purple
          white: "#e0e0ff",        // Soft white text
          muted: "#8888aa",        // Muted text
          error: "#ff4d6a",        // Error red
          success: "#00ff9d",      // Success green
        }
      },

      // 2. FONT FAMILY
      fontFamily: {
        display: ["'Orbitron'", "'Rajdhani'", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },

      // 3. BOX SHADOW (Neon Glow)
      boxShadow: {
        'neon-cyan': '0 0 5px #00f5d4, 0 0 20px rgba(0, 245, 212, 0.3), inset 0 0 5px rgba(0, 245, 212, 0.1)',
        'neon-purple': '0 0 5px #9d4edd, 0 0 20px rgba(157, 78, 221, 0.3), inset 0 0 5px rgba(157, 78, 221, 0.1)',
        'glow-soft': '0 0 10px rgba(0, 245, 212, 0.15)',
      },

      // 4. KEYFRAMES (Definisi Animasi untuk Tailwind)
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'glitch': {
          '0%': { transform: 'translate(0)', filter: 'hue-rotate(0deg)' },
          '20%': { transform: 'translate(-2px, 2px)', filter: 'hue-rotate(90deg)' },
          '40%': { transform: 'translate(-2px, -2px)', filter: 'hue-rotate(180deg)' },
          '60%': { transform: 'translate(2px, 2px)', filter: 'hue-rotate(270deg)' },
          '80%': { transform: 'translate(2px, -2px)', filter: 'hue-rotate(360deg)' },
          '100%': { transform: 'translate(0)', filter: 'hue-rotate(0deg)' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        'avatar-glow': {
          '0%, 100%': { boxShadow: '0 0 10px currentColor' },
          '50%': { boxShadow: '0 0 20px currentColor, 0 0 30px currentColor' },
        },
        'trust-pulse': {
          '0%': { transform: 'scaleX(1)' },
          '50%': { transform: 'scaleX(1.05)' },
          '100%': { transform: 'scaleX(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
      },

      // 5. ANIMATION (Shortcut Class: animate-[nama])
      animation: {
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'glitch': 'glitch 0.3s cubic-bezier(.25,.46,.45,.94) both',
        'confetti-fall': 'confetti-fall 3s ease-in-out forwards',
        'avatar-glow': 'avatar-glow 2s ease-in-out infinite',
        'trust-pulse': 'trust-pulse 0.3s ease',
        'float': 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}