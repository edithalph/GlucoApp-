import type { Config } from "tailwindcss";

/**
 * Palette Adobe fournie : marine, océan, turquoise, brume et ambre.
 * Les variantes claires/foncées assurent un texte lisible sur chaque surface.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#173B57",
          ocean: "#247BA0",
          teal: "#56B8B0",
          mist: "#E5F3F4",
          gold: "#F4B942",
        },
        background: "#F4F8FA",
        "on-background": "#173B57",

        surface: "#F4F8FA",
        "surface-dim": "#D2E4EB",
        "surface-bright": "#F8FCFD",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#EDF5F7",
        "surface-container": "#E5F3F4",
        "surface-container-high": "#DCECF0",
        "surface-container-highest": "#D2E4EB",
        "surface-variant": "#E5F3F4",
        "surface-tint": "#56B8B0",
        "on-surface": "#173B57",
        "on-surface-variant": "#526A7B",
        "inverse-surface": "#173B57",
        "inverse-on-surface": "#E5F3F4",

        outline: "#718797",
        "outline-variant": "#C8DBE3",

        primary: "#247BA0",
        "on-primary": "#ffffff",
        "primary-container": "#173B57",
        "on-primary-container": "#FFFFFF",
        "inverse-primary": "#56B8B0",
        "primary-fixed": "#E5F3F4",
        "primary-fixed-dim": "#56B8B0",
        "on-primary-fixed": "#173B57",
        "on-primary-fixed-variant": "#235F67",

        secondary: "#247BA0",
        "on-secondary": "#ffffff",
        "secondary-container": "#D5EBF5",
        "on-secondary-container": "#173B57",
        "secondary-fixed": "#E5F0F8",
        "secondary-fixed-dim": "#A5CDDF",
        "on-secondary-fixed": "#173B57",
        "on-secondary-fixed-variant": "#205675",

        tertiary: "#785209",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#785209",
        "on-tertiary-container": "#FFFAEB",
        "tertiary-fixed": "#FFF1D2",
        "tertiary-fixed-dim": "#F4B942",
        "on-tertiary-fixed": "#4D350B",
        "on-tertiary-fixed-variant": "#6D4A09",

        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.75rem",
        xl: "1.125rem",
        full: "9999px",
      },
      spacing: {
        unit: "8px",
        gutter: "16px",
        "stack-sm": "8px",
        "stack-md": "16px",
        "stack-lg": "24px",
        "container-padding-mobile": "20px",
        "container-padding-desktop": "32px",
      },
      fontFamily: {
        "display-hero": ["var(--font-inter)", "sans-serif"],
        "headline-lg": ["var(--font-inter)", "sans-serif"],
        "headline-lg-mobile": ["var(--font-inter)", "sans-serif"],
        "headline-md": ["var(--font-inter)", "sans-serif"],
        "title-lg": ["var(--font-inter)", "sans-serif"],
        "body-lg": ["var(--font-inter)", "sans-serif"],
        "body-md": ["var(--font-inter)", "sans-serif"],
        "label-md": ["var(--font-inter)", "sans-serif"],
      },
      fontSize: {
        "display-hero": [
          "42px",
          { lineHeight: "52px", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
        "headline-lg": ["32px", { lineHeight: "40px", fontWeight: "600" }],
        "headline-lg-mobile": [
          "28px",
          { lineHeight: "36px", fontWeight: "600" },
        ],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "500" }],
        "title-lg": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-md": ["12px", { lineHeight: "16px", fontWeight: "600" }],
      },
      boxShadow: {
        // « Cloud shadow » du design system : jamais d'ombre dure.
        card: "0 4px 24px -8px rgba(23, 59, 87, 0.12)",
        dock: "0 -4px 24px rgba(23, 59, 87, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
