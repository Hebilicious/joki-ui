import vize from "@vizejs/vite-plugin";
import { vaporTesting } from "@joki-ui/vapor-testing/vite";
import { playwright } from "vite-plus/test/browser-playwright";
import { defineConfig } from "vite-plus/test/config";

export default defineConfig({
  plugins: [...vize({ configMode: false, scanPatterns: [], vapor: true }), vaporTesting()],
  // Prebundling a package that creates Vue reactivity gives the page a second Vue runtime.
  optimizeDeps: { include: ["vue", "xstate"], exclude: ["@xstate/vue"] },
  test: {
    include: ["tests/**/*.test.ts"],
    setupFiles: ["@joki-ui/vapor-testing/setup"],
    retry: 0,
    testTimeout: 60_000,
    hookTimeout: 60_000,
    browser: {
      enabled: true,
      headless: true,
      ui: false,
      screenshotFailures: false,
      provider: playwright(),
      viewport: { width: 1000, height: 800 },
      instances: [{ browser: "chromium" }],
    },
  },
});
