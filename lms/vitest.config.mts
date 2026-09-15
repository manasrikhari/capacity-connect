import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Resolve "@/..." to the lms root in both ESM and CJS config loaders.
const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: { include: ["lib/__tests__/**/*.test.ts"], environment: "node" },
  resolve: { alias: { "@": root } },
});
