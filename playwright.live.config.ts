import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

const previewUrl = process.env.PLAYWRIGHT_BASE_URL;
if (!previewUrl) {
  throw new Error("Set PLAYWRIGHT_BASE_URL to the isolated Preview deployment; there is no production default.");
}

export default defineConfig({
  ...base,
  use: {
    ...base.use,
    baseURL: previewUrl,
  },
  webServer: undefined,
});
