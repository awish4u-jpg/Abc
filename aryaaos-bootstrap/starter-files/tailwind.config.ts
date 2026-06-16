import type { Config } from "tailwindcss";

// AryaaOS — Layer 1 design tokens (placeholder, finalized Day 10)
// Editorial-quiet direction: generous whitespace, restrained color, Playfair + Inter.

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Playfair Display for hero/quote moments (Pulse, page titles, Stage banner)
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        // Inter for everything else
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        // JetBrains Mono for code blocks
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
      },
      colors: {
        // Layer 1 brand — final hex values locked Day 10
        brand: {
          50: "#faf7f2",   // off-white background (light mode)
          100: "#f3eee5",
          200: "#e6dcc9",
          300: "#d2c2a3",
          400: "#b8a079",
          500: "#9a7f55",
          600: "#7a6340",
          700: "#5a4830",
          800: "#3d3020",
          900: "#1f1810",
        },
        // Single accent — Layer 1 purple-restrained
        accent: {
          DEFAULT: "#5a4dbf",
          foreground: "#faf7f2",
        },
        // Mood-based semantic colors (subtle, never shouty)
        urgent: "#a83233",   // urgent red, used sparingly
        warning: "#b88840",   // rotten amber
        success: "#5a8b5a",   // calm green
        // Mode indicators
        stage: "#8b6f43",     // Stage mode accent (warm earth)
        solo: "#5a4dbf",      // Solo mode accent (Layer 1 purple)
        // shadcn/ui base tokens
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      spacing: {
        // Generous whitespace tokens
        pulse: "7.5rem",       // Pulse zone vertical padding
        section: "3rem",        // between dashboard sections
        widget: "1.5rem",       // inside widgets
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
        xl: "0.875rem",
      },
      fontSize: {
        // Pulse-specific scales
        "pulse-desktop": ["2rem", { lineHeight: "2.75rem", letterSpacing: "-0.01em" }],
        "pulse-mobile": ["1.375rem", { lineHeight: "2rem", letterSpacing: "-0.005em" }],
        // Page hero
        hero: ["2.75rem", { lineHeight: "3.25rem", letterSpacing: "-0.015em" }],
      },
      animation: {
        "pulse-fade": "pulseFade 0.6s ease-out",
        "card-slide-up": "cardSlideUp 0.3s ease-out",
        "queue-collapse": "queueCollapse 0.2s ease-in",
      },
      keyframes: {
        pulseFade: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        cardSlideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        queueCollapse: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
