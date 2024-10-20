import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  extensionApi: 'webextension-polyfill',
  modules: ['@wxt-dev/module-svelte'],

  manifest: {
    permissions: ["cookies", "storage", "offscreen"],
    host_permissions: ["https://x.com/", "https://api.x.com/"]
  },

  alias: {
    "$lib": "./src/lib",
  }
});