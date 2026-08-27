/** @type {import("prettier").Config} */
const config = {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 88,
  tabWidth: 2,
  arrowParens: "always",
  endOfLine: "lf",
  // Must stay last — it re-orders Tailwind classes after every other plugin.
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./src/app/globals.css",
  tailwindFunctions: ["cn", "cva", "clsx", "twMerge"],
};

export default config;
