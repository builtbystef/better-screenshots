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
      ".agents/**",
      ".claude/**",
      ".pi/**",
      ".beaver/**",
      "**/routeTree.gen.ts",
    ],
  },
  test: {
    globalSetup: ["apps/web/src/test/ensure-canvas-shim.ts"],
  },
  pack: {
    dts: true,
    sourcemap: true,
  },
  run: {
    cache: true,
  },
});
