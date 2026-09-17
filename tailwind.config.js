/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tropical: {
          sky: '#60c5f8',
          skyLight: '#bde9ff',
          coral: '#ff6b8b',
          coralLight: '#ff8da1',
          coralSoft: '#ffe3e8',
          yellow: '#ffd166',
          yellowLight: '#fff0bd',
          aqua: '#00bbf9',
          aquaLight: '#a0f0ed',
          mint: '#06d6a0',
          mintLight: '#c7f9cc',
          sand: '#fff6ed',
          sandDark: '#fae1dd',
          palm: '#2ec4b6',
          palmDark: '#127471',
          card: 'rgba(255, 255, 255, 0.88)',
          cardGlass: 'rgba(255, 255, 255, 0.75)',
          textDark: '#1e293b',
          textMuted: '#64748b',
        },
      },
      fontFamily: {
        fredoka: ['Fredoka', 'system-ui', 'sans-serif'],
        outfit: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'tropical-sm': '0 4px 15px rgba(0, 0, 0, 0.06)',
        'tropical-md': '0 8px 25px rgba(255, 107, 139, 0.15)',
        'tropical-lg': '0 12px 36px rgba(0, 0, 0, 0.12)',
        'tropical-glow': '0 0 25px rgba(255, 209, 102, 0.45)',
        'coral-glow': '0 0 20px rgba(255, 107, 139, 0.35)',
        'aqua-glow': '0 0 20px rgba(0, 187, 249, 0.35)',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'cloud-drift': 'cloudDrift 25s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.02)' },
        },
        cloudDrift: {
          '0%': { transform: 'translateX(-10%)' },
          '100%': { transform: 'translateX(110%)' },
        }
      }
    },
  },
  plugins: [],
}
