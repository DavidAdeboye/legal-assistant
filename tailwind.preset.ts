import type { Config } from "tailwindcss";

const preset = {
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
  },
} satisfies Partial<Config>;

export default preset;

