/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.html", "./src/**/*.js"],
  theme: {
    extend: {
      colors: {
        paper: "#fcfcfa",
        ink: "#15151b",
        accent: "#4f46e5",
        soft: "#eef2ff"
      },
      fontFamily: {
        sans: ['"Space Grotesk Variable"', "ui-sans-serif", "system-ui"],
        serif: ['"Source Serif 4"', "ui-serif", "Georgia"],
        mono: ["Monostain", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      },
      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,.06)"
      }
    }
  },
  plugins: [require("@tailwindcss/typography")]
};
