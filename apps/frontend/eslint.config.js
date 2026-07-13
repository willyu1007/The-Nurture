// Typography-lock governance via the kit's shared ESLint preset (bans literal
// inline font-size/weight/family in JSX — use a kit type class or scale token).
import parser from "@typescript-eslint/parser";
import workbench from "@willyu1007/web-workbench/eslint";

export default [
  { ignores: ["node_modules/**", ".next/**", "next-env.d.ts"] },
  // The kit rule operates on the AST; a TS/JSX-capable parser is required.
  { files: ["src/**/*.{ts,tsx}"], languageOptions: { parser } },
  ...workbench,
];
