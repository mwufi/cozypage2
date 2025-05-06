import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                'space-mono': ['var(--font-space-mono)'],
                'orbitron': ['var(--font-orbitron)'],
            },
        },
    },
    plugins: [],
};

export default config; 