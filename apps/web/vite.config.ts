import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      spa: {
        enabled: true,
        // Emit the SPA shell as index.html (the default is /_shell.html) so
        // dist/client deploys to any static host with no rewrite rules.
        prerender: {
          outputPath: "/index.html",
        },
      },
    }),
    viteReact(),
  ],
});
