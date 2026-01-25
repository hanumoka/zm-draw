import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Figma UI3 스타일 다크 테마 컬러
        'zm-bg': {
          primary: '#1e1e1e',
          secondary: '#2c2c2c',
          tertiary: '#383838',
          canvas: '#252525',
        },
        'zm-border': {
          DEFAULT: '#3c3c3c',
          hover: '#5c5c5c',
        },
        'zm-text': {
          primary: '#ffffff',
          secondary: '#a0a0a0',
          muted: '#6b6b6b',
        },
        'zm-accent': {
          DEFAULT: '#0d99ff',
          hover: '#0c8ce9',
        },
      },
    },
  },
  plugins: [],
};

export default config;
