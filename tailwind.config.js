/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "var(--color-void)",
        obsidian: "var(--color-obsidian)",
        graphite: "var(--color-graphite)",
        ash: "var(--color-ash)",
        frost: "var(--color-frost)",
        paper: "var(--color-paper)",
        "pure-white": "var(--color-pure-white)",
        "sapphire-volt": "var(--color-sapphire-volt)",
        "fleet-border": "var(--fleet-border)",
        "fleet-border-strong": "var(--fleet-border-strong)",
        "fleet-hover": "var(--fleet-hover)",
        "fleet-on-paper": "var(--fleet-on-paper)",
        "fleet-sidebar": "var(--fleet-sidebar)",
        "fleet-muted": "var(--fleet-muted)",
      },
      fontFamily: {
        display: [
          "var(--font-google-sans)",
          "Google Sans",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        body: [
          "var(--font-google-sans)",
          "Google Sans",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        instrument: [
          "var(--font-instrument-serif)",
          "Instrument Serif",
          "ui-serif",
          "Georgia",
          "serif",
        ],
        mono: [
          "var(--font-ibm-plex-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        xxs: "0.65rem",
        caption: [
          "var(--text-caption)",
          { lineHeight: "var(--leading-caption)" },
        ],
        body: ["var(--text-body)", { lineHeight: "var(--leading-body)" }],
        "body-lg": [
          "var(--text-body-lg)",
          { lineHeight: "var(--leading-body-lg)" },
        ],
        subheading: [
          "var(--text-subheading)",
          { lineHeight: "var(--leading-subheading)" },
        ],
        heading: [
          "var(--text-heading)",
          { lineHeight: "var(--leading-heading)" },
        ],
      },
      spacing: {
        "atlas-8": "var(--spacing-8)",
        "atlas-16": "var(--spacing-16)",
        "atlas-24": "var(--spacing-24)",
        "atlas-32": "var(--spacing-32)",
        "atlas-48": "var(--spacing-48)",
        "atlas-64": "var(--spacing-64)",
        "atlas-88": "var(--spacing-88)",
        "atlas-104": "var(--spacing-104)",
        "atlas-128": "var(--spacing-128)",
        "atlas-144": "var(--spacing-144)",
        "atlas-176": "var(--spacing-176)",
      },
      maxWidth: {
        page: "var(--page-max-width)",
      },
      borderRadius: {
        tags: "var(--radius-tags)",
        cards: "var(--radius-cards)",
        pills: "var(--radius-pills)",
        inputs: "var(--radius-inputs)",
        buttons: "var(--radius-buttons)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
