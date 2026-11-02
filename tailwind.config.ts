import type { Config } from "tailwindcss";

/**
 * Design system « Botanical Health Narrative ».
 * Port direct des tokens générés par Google Stitch
 * (projet 10900663085498802054), afin que les classes utilisées dans les
 * maquettes fonctionnent telles quelles.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f8f9f9",
        "on-background": "#191c1c",

        surface: "#f8f9f9",
        "surface-dim": "#d9dada",
        "surface-bright": "#f8f9f9",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f4f4",
        "surface-container": "#edeeee",
        "surface-container-high": "#e7e8e8",
        "surface-container-highest": "#e1e3e3",
        "surface-variant": "#e1e3e3",
        "surface-tint": "#006d3f",
        "on-surface": "#191c1c",
        "on-surface-variant": "#3f4941",
        "inverse-surface": "#2e3131",
        "inverse-on-surface": "#f0f1f1",

        outline: "#6f7a70",
        "outline-variant": "#bec9be",

        primary: "#006036",
        "on-primary": "#ffffff",
        "primary-container": "#1a7a4a",
        "on-primary-container": "#abffc6",
        "inverse-primary": "#80d9a0",
        "primary-fixed": "#9bf6ba",
        "primary-fixed-dim": "#80d9a0",
        "on-primary-fixed": "#00210f",
        "on-primary-fixed-variant": "#00522e",

        secondary: "#2f6388",
        "on-secondary": "#ffffff",
        "secondary-container": "#a3d4fe",
        "on-secondary-container": "#275c81",
        "secondary-fixed": "#cbe6ff",
        "secondary-fixed-dim": "#9bccf6",
        "on-secondary-fixed": "#001e30",
        "on-secondary-fixed-variant": "#0e4b6e",

        tertiary: "#6b4e00",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#896500",
        "on-tertiary-container": "#ffeac6",
        "tertiary-fixed": "#ffdfa0",
        "tertiary-fixed-dim": "#f6be39",
        "on-tertiary-fixed": "#261a00",
        "on-tertiary-fixed-variant": "#5c4300",

        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
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
        "display-hero": ["var(--font-newsreader)", "serif"],
        "headline-lg": ["var(--font-newsreader)", "serif"],
        "headline-lg-mobile": ["var(--font-newsreader)", "serif"],
        "headline-md": ["var(--font-newsreader)", "serif"],
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
        "headline-lg-mobile": ["28px", { lineHeight: "36px", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "500" }],
        "title-lg": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-md": ["12px", { lineHeight: "16px", fontWeight: "600" }],
      },
      boxShadow: {
        // « Cloud shadow » du design system : jamais d'ombre dure.
        card: "0 4px 12px rgba(26, 82, 118, 0.08)",
        dock: "0 -4px 12px rgba(26, 82, 118, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
