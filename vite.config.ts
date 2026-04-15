import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Plugin that serves GET /config from process.env during local dev,
// mirroring what the Express server does in production.
function configEndpointPlugin(env: Record<string, string>) {
  return {
    name: 'config-endpoint',
    configureServer(server: any) {
      server.middlewares.use('/config', (_req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          VITE_API_BASE_URL:        env.VITE_API_BASE_URL        || '',
          VITE_OAUTH2_CLIENT_ID:    env.VITE_OAUTH2_CLIENT_ID    || '',
          VITE_OAUTH2_REDIRECT_URI: env.VITE_OAUTH2_REDIRECT_URI || '',
          VITE_ORY_HYDRA_PUBLIC:    env.VITE_ORY_HYDRA_PUBLIC    || '',
          VITE_ORY_KRATOS_PUBLIC:   env.VITE_ORY_KRATOS_PUBLIC   || '',
          VITE_EXT_OIDC_CLIENT_ID:  env.VITE_EXT_OIDC_CLIENT_ID  || '',
          VITE_EXT_OIDC_REDIRECT_URI: env.VITE_EXT_OIDC_REDIRECT_URI || '',
          VITE_ISSUER_DID:          env.VITE_ISSUER_DID          || '',
          VITE_SCHEMA_ID:           env.VITE_SCHEMA_ID           || '',
          VITE_SCHEMA_VERSION:      env.VITE_SCHEMA_VERSION      || '',
          VITE_TEMPLATE_ID:         env.VITE_TEMPLATE_ID         || '',
        }));
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: "0.0.0.0",
      port: 3000,
      proxy: {
        '/ory/hydra-admin': {
          target: 'http://localhost:4445',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/ory\/hydra-admin/, ''),
        },
        '/ory/hydra': {
          target: 'http://localhost:4444',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/ory\/hydra/, ''),
        },
        '/ory/kratos': {
          target: 'http://localhost:4433',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/ory\/kratos/, ''),
        },
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
      configEndpointPlugin(env),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
