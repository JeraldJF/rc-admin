import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/auth': {
        target: process.env.VITE_API_BASE_URL || '',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
      '/registry': {
        target: process.env.VITE_API_BASE_URL || '',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
