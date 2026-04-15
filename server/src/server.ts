import express, { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from project root (two levels up from server/src/)
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ---------------------------------------------------------------------------
// Runtime config endpoint
// Returns non-sensitive env vars to the frontend at runtime.
// ---------------------------------------------------------------------------
app.get('/config', (_req: Request, res: Response) => {
  res.json({
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || '',
    VITE_OAUTH2_CLIENT_ID: process.env.VITE_OAUTH2_CLIENT_ID || '',
    VITE_OAUTH2_REDIRECT_URI: process.env.VITE_OAUTH2_REDIRECT_URI || '',
    VITE_ORY_HYDRA_PUBLIC: process.env.VITE_ORY_HYDRA_PUBLIC || '',
    VITE_ORY_HYDRA_ADMIN: process.env.VITE_ORY_HYDRA_ADMIN || '',
    VITE_ORY_KRATOS_PUBLIC: process.env.VITE_ORY_KRATOS_PUBLIC || '',
    VITE_EXT_OIDC_CLIENT_ID: process.env.VITE_EXT_OIDC_CLIENT_ID || '',
    VITE_EXT_OIDC_REDIRECT_URI: process.env.VITE_EXT_OIDC_REDIRECT_URI || '',
    VITE_ISSUER_DID: process.env.VITE_ISSUER_DID || '',
    VITE_SCHEMA_ID: process.env.VITE_SCHEMA_ID || '',
    VITE_SCHEMA_VERSION: process.env.VITE_SCHEMA_VERSION || '',
    VITE_TEMPLATE_ID: process.env.VITE_TEMPLATE_ID || '',
  });
});

// ---------------------------------------------------------------------------
// Auth token endpoints
// Secrets live here on the server — never in the frontend bundle.
// ---------------------------------------------------------------------------

// POST /auth/token
// Handles Hydra OAuth2 authorization_code exchange and refresh_token grant.
// The client only sends grant_type + code/redirect_uri or refresh_token;
// the server adds client_id + client_secret before forwarding to Hydra.
app.post('/auth/token', async (req: Request, res: Response) => {
  const { grant_type, code, redirect_uri, refresh_token } = req.body;

  const clientId = process.env.VITE_OAUTH2_CLIENT_ID;
  const clientSecret = process.env.OAUTH2_CLIENT_SECRET;
  const hydraPublicUrl = (process.env.ORY_HYDRA_PUBLIC_URL || 'http://localhost:4444').replace(/\/$/, '');

  if (!clientId || !clientSecret) {
    res.status(500).json({ error: 'OAuth2 client credentials not configured on server' });
    return;
  }

  const params = new URLSearchParams({ grant_type, client_id: clientId, client_secret: clientSecret });

  if (grant_type === 'authorization_code') {
    if (!code || !redirect_uri) {
      res.status(400).json({ error: 'code and redirect_uri are required for authorization_code grant' });
      return;
    }
    params.set('code', code);
    params.set('redirect_uri', redirect_uri);
  } else if (grant_type === 'refresh_token') {
    if (!refresh_token) {
      res.status(400).json({ error: 'refresh_token is required for refresh_token grant' });
      return;
    }
    params.set('refresh_token', refresh_token);
  } else {
    res.status(400).json({ error: `Unsupported grant_type: ${grant_type}` });
    return;
  }

  try {
    const response = await fetch(`${hydraPublicUrl}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('[/auth/token] Hydra request failed:', err);
    res.status(502).json({ error: 'Failed to reach Hydra token endpoint' });
  }
});

// POST /auth/ext-token
// Handles authorization_code exchange with the external OIDC provider.
// The client sends only code + redirect_uri; the server adds client credentials.
app.post('/auth/ext-token', async (req: Request, res: Response) => {
  const { code, redirect_uri } = req.body;

  const clientId = process.env.VITE_EXT_OIDC_CLIENT_ID;
  const clientSecret = process.env.EXT_OIDC_CLIENT_SECRET;
  const extOidcBaseUrl = (process.env.EXT_OIDC_BASE_URL || 'https://cuenta.digital.gob.do').replace(/\/$/, '');

  if (!clientId || !clientSecret) {
    res.status(500).json({ error: 'External OIDC client credentials not configured on server' });
    return;
  }

  if (!code || !redirect_uri) {
    res.status(400).json({ error: 'code and redirect_uri are required' });
    return;
  }

  try {
    const response = await fetch(`${extOidcBaseUrl}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('[/auth/ext-token] External OIDC request failed:', err);
    res.status(502).json({ error: 'Failed to reach external OIDC token endpoint' });
  }
});

// ---------------------------------------------------------------------------
// Proxy routes — mirrors vite.config.ts proxy config so the same paths work
// in production. Order matters: more specific paths must be registered first.
// ---------------------------------------------------------------------------

// Ory Hydra Admin API
app.use(
  '/ory/hydra-admin',
  createProxyMiddleware({
    target: process.env.ORY_HYDRA_ADMIN_URL || 'http://localhost:4445',
    changeOrigin: true,
    pathRewrite: { '^/ory/hydra-admin': '' },
  })
);

// Ory Hydra Public API (registered after hydra-admin to avoid prefix clash)
app.use(
  '/ory/hydra',
  createProxyMiddleware({
    target: process.env.ORY_HYDRA_PUBLIC_URL || 'http://localhost:4444',
    changeOrigin: true,
    pathRewrite: { '^/ory/hydra': '' },
  })
);

// Ory Kratos Public API
app.use(
  '/ory/kratos',
  createProxyMiddleware({
    target: process.env.ORY_KRATOS_PUBLIC_URL || 'http://localhost:4433',
    changeOrigin: true,
    pathRewrite: { '^/ory/kratos': '' },
  })
);

// External OIDC — /userinfo endpoint (must be registered before the general ext-oidc proxy)
app.use(
  '/ext-oidc/userinfo',
  createProxyMiddleware({
    target: process.env.EXT_OIDC_BASE_URL || 'https://cuenta.digital.gob.do',
    changeOrigin: true,
    pathRewrite: (_path) => '/userinfo',
  })
);

// External OIDC — all other routes (rewritten from /ext-oidc/* to /oauth2/*)
app.use(
  '/ext-oidc',
  createProxyMiddleware({
    target: process.env.EXT_OIDC_BASE_URL || 'https://cuenta.digital.gob.do',
    changeOrigin: true,
    pathRewrite: (reqPath) => reqPath.replace(/^\/ext-oidc/, '/oauth2'),
  })
);

// Registry API (must be registered before /api to avoid the shorter prefix matching first)
app.use(
  '/registry/api',
  createProxyMiddleware({
    target: process.env.API_BASE_URL || 'http://localhost:8081',
    changeOrigin: true,
    pathRewrite: { '^/registry': '' },
  })
);

// Backend API
app.use(
  '/api',
  createProxyMiddleware({
    target: process.env.API_BASE_URL || 'http://localhost:8081',
    changeOrigin: true,
  })
);

// Credential service
app.use(
  '/credential',
  createProxyMiddleware({
    target: process.env.CREDENTIAL_SERVICE_URL || 'http://localhost:3005',
    changeOrigin: true,
  })
);

// ---------------------------------------------------------------------------
// Static frontend
// In Docker production: /app/dist  (frontend-build stage output)
// In local dev:         ../../dist (after running `npm run build` in project root)
// ---------------------------------------------------------------------------
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// SPA fallback — return index.html for any route the frontend router handles
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`RC Admin server running on port ${PORT}`);
  console.log(`Serving frontend from: ${distPath}`);
});
