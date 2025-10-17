import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Corporate firewall-friendly: Use system fonts only
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'jcb-yellow': 'var(--jcb-yellow)',
        'jcb-yellow-dark': 'var(--jcb-yellow-dark)',
        'jcb-black': 'var(--jcb-black)',
        'jcb-dark-gray': 'var(--jcb-dark-gray)',
        'jcb-light-gray': 'var(--jcb-light-gray)',
        'jcb-white': 'var(--jcb-white)',
      },
    },
  },
  plugins: [],
};

export default config;
