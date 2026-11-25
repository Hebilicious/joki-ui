import vize from "@vizejs/vite-plugin";
import { playwright } from "vite-plus/test/browser-playwright";
import { defineConfig } from "vite-plus/test/config";

import { vaporTesting } from "./src/vite.ts";

export default defineConfig({
  plugins: [
    ...vize({ configMode: false, scanPatterns: [], vapor: true }),
    vaporTesting({ stubbable: ["GreetingButton"] }),
  ],
  test: {
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./src/setup.ts"],
    retry: 0,
    testTimeout: 60_000,
    hookTimeout: 60_000,
    browser: {
      enabled: true,
      headless: true,
      ui: false,
      screenshotFailures: false,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
});
