import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Prisma client and shipped landing assets are not our source.
    "app/generated/**",
    "public/**",
  ]),
  {
    // Next 16 ships the React Compiler's react-hooks rules at error level.
    // Two of them flag correct, intentional patterns used throughout this
    // codebase, so we keep them visible as warnings rather than errors:
    //   - set-state-in-effect: fires on the hydration-safe `setState(new Date())`
    //     mount pattern and on post-layout measurement (both required here).
    //   - immutability: fires on mutually-referential useCallback springs.
    // no-explicit-any stays a warning for the third-party AI SDK response
    // shapes in lib/ai-provider.ts that have no published types.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
