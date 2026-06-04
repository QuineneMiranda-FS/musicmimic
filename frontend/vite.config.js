import { defineConfig } from "vite";
import vue from "@vitejs/vue";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Allows '@' shortcut for src imports
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173, // Standard Vite dev port
    proxy: {
      // Any request starting with /api sent to Express
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
