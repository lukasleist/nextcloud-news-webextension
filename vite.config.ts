import path from "path";
import { defineConfig } from "vite";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";
import vue from "@vitejs/plugin-vue2";

export default defineConfig({
  root: "src",
  publicDir: "_locales",
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  plugins: [
    vue(),
    webExtension({
      manifest: () => {
        const packageJson = readJsonFile("package.json");
        return {
          ...readJsonFile("src/manifest.json"),
          name: packageJson.name,
          version: packageJson.version,
        };
      },
      assets: "assets",
      browser: "chrome",
    }),
  ],
});
