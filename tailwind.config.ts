import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                }
            },
            screens: {
                sm: {
                    max: '809px'
                },
                md: {
                    min: '810px',
                    max: '1023px'
                },
                lg: {
                    min: '1024px'
                },
                mobile: {
                    max: '360px'
                },
                tablet: {
                    min: '810px',
                    max: '1280px'
                },
                desktop: {
                    min: '1280px'
                }
            },
            fontFamily: {
                montserrat: [
                    'var(--font-montserrat)',
                ]
            },
        }
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config;
