import path from "path";
import { defineConfig } from "vite";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";
import { viteStaticCopy } from "vite-plugin-static-copy";
import vue from "@vitejs/plugin-vue2";

export default defineConfig(({ command, mode }) => ({
  root: "src",
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    sourcemap: mode == "development",
  },
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: "_locales",
          dest: ".",
        },
      ],
    }),
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
      browser: process.env.TARGET_BROWSER
        ? process.env.TARGET_BROWSER
        : "firefox",
      webExtConfig: {
        startUrl: [
          process.env.TARGET_BROWSER && process.env.TARGET_BROWSER == "firefox"
            ? "about:debugging#/runtime/this-firefox"
            : "chrome://extensions",
        ],
        verbose: true,
      },
    }),
  ],
}));
