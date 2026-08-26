import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: [".agents/**", ".claude/**", ".pi/**", ".beaver/**", "**/routeTree.gen.ts"],
  },
  lint: {
    plugins: ["typescript", "unicorn", "oxc", "react", "jsx-a11y"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    ignorePatterns: [
      "**/dist/**",
      "**/coverage/**",
      ".agents/**",
      ".claude/**",
      ".pi/**",
      ".beaver/**",
      "**/routeTree.gen.ts",
    ],
  },
  test: {
    globalSetup: ["apps/web/src/test/ensure-canvas-shim.ts"],
    coverage: {
      thresholds: {
        statements: 93,
        branches: 90,
        functions: 94,
        lines: 94,
      },
    },
  },
  pack: {
    dts: true,
    sourcemap: true,
  },
  run: {
    cache: true,
  },
});
