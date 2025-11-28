import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      '/auth': {
        target: process.env.VITE_API_BASE_URL || 'http://4.240.119.167',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Auth proxy error', err);
          });
        },
      },
      '/registry': {
        target: process.env.VITE_API_BASE_URL || 'http://4.240.119.167',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Registry proxy error', err);
          });
        },
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      '/auth': {
        target: process.env.VITE_API_BASE_URL || 'http://4.240.119.167',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
      '/registry': {
        target: process.env.VITE_API_BASE_URL || 'http://4.240.119.167',
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
