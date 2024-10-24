import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  extensionApi: "webextension-polyfill",
  modules: ["@wxt-dev/module-svelte", "@wxt-dev/auto-icons"],

  manifest: ({ manifestVersion }) => ({
    permissions: manifestVersion === 3 ? ["cookies", "storage", "offscreen"]: ["cookies", "storage"],
    host_permissions: ["https://x.com/", "https://api.x.com/"],
  }),

  alias: {
    $lib: "./src/lib",
  },
});
