import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      // Ory Hydra Admin API (must come before /ory/hydra to avoid prefix collision)
      '/ory/hydra-admin': {
        target: 'http://localhost:4445',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ory\/hydra-admin/, ''),
      },
      // Ory Hydra Public API
      '/ory/hydra': {
        target: 'http://localhost:4444',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ory\/hydra/, ''),
      },
      // Ory Kratos Public API
      '/ory/kratos': {
        target: 'http://localhost:4433',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ory\/kratos/, ''),
      },
      // Proxy external OIDC token exchange to avoid CORS issues in dev
      '/ext-oidc/userinfo': {
        target: 'https://cuenta.digital.gob.do',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/userinfo',
      },
      '/ext-oidc/': {
        target: 'https://cuenta.digital.gob.do',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/ext-oidc/, '/oauth2'),
      },
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('Origin');
            proxyReq.removeHeader('Referer');
          });
        },
      },
      '/registry/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/registry/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('Origin');
            proxyReq.removeHeader('Referer');
          });
        },
      },
      '/credential/': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/credential/, ''),
      },
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
