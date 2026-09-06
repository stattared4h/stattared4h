// ESLint for the TypeScript in source/ts/ and tests/. Build scripts are plain ESM and
// are linted with the base rules only.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["public/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,ts}"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        fetch: "readonly",
      },
    },
    rules: {
      // DOM is built with createElement and textContent, never innerHTML (CLAUDE.md §2.13).
      "no-restricted-properties": [
        "error",
        { property: "innerHTML", message: "Build DOM with createElement/textContent (CLAUDE.md §2.13)." },
        { property: "outerHTML", message: "Build DOM with createElement/textContent (CLAUDE.md §2.13)." },
        { property: "insertAdjacentHTML", message: "Build DOM with createElement/textContent (CLAUDE.md §2.13)." },
      ],
    },
  },
);
