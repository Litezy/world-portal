import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),

  ...nextVitals,
  ...nextTs,

  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      // Deterministic import order: react/next -> packages -> @/ aliases -> relative.
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^react$", "^next", "^node:"],
            ["^@?\\w"],
            ["^@/"],
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
            ["^.+\\.s?css$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "react/jsx-curly-brace-presence": ["warn", { props: "never", children: "never" }],
    },
  },

  {
    files: ["**/*.test.{ts,tsx}", "tests/**/*", "e2e/**/*"],
    rules: { "no-console": "off" },
  },

  // Must come last so formatting rules never fight Prettier.
  prettier,
]);

export default eslintConfig;
