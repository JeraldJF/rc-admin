import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import dotenv from 'dotenv';
import session from 'express-session';
import connectPg from 'connect-pg-simple';

// Load .env from project root (two levels up from server/src/)
dotenv.config({ path: path.join(__dirname, '../../.env') });

// ---------------------------------------------------------------------------
// Session data shape — TypeScript knows what fields live in the session.
// ---------------------------------------------------------------------------
declare module 'express-session' {
  interface SessionData {
    accessToken: string;
    refreshToken: string;
    idToken: string;    // preserved for Sidebar OIDC logout hint
    expiresAt: number;  // Unix ms — when the access token expires
    userEmail: string;
    userName: string;
  }
}

const app = express();
const PORT = process.env.PORT || 8080;

// Body parsers are intentionally NOT registered globally — applying them to
// proxied routes consumes the request stream, so Hydra/Kratos/etc. receive an
// empty body. They are applied inline only on the routes that actually need them.

// ---------------------------------------------------------------------------
// Session middleware — must run before all routes.
// Uses PostgreSQL as the session store (same instance Hydra uses).
// SameSite=lax is required: 'strict' drops the cookie on the Hydra redirect.
// ---------------------------------------------------------------------------
const PgStore = connectPg(session);
app.use(session({
  store: new PgStore({
    conString: process.env.SESSION_DB_URL,
    createTableIfMissing: true,
    tableName: 'rc_admin_sessions',
  }),
  secret: process.env.SESSION_SECRET || 'fallback-dev-secret-replace-in-prod',
  name: 'rc-session',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

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
// Hydra Admin helper — server-side only, never sent to the browser.
// ---------------------------------------------------------------------------
const hydraAdminUrl = () =>
  (process.env.ORY_HYDRA_ADMIN_URL || 'http://localhost:4445').replace(/\/$/, '');

const hydraPublicUrl = () =>
  (process.env.ORY_HYDRA_PUBLIC_URL || 'http://localhost:4444').replace(/\/$/, '');

// ---------------------------------------------------------------------------
// Token refresh helper — exchanges a refresh_token for a new access_token.
// ---------------------------------------------------------------------------
interface RefreshedTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  id_token?: string;
}

async function refreshSessionToken(refreshToken: string): Promise<RefreshedTokens> {
  const clientId = process.env.VITE_OAUTH2_CLIENT_ID;
  const clientSecret = process.env.OAUTH2_CLIENT_SECRET;

  const response = await fetch(`${hydraPublicUrl()}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId!,
      client_secret: clientSecret!,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// injectSessionToken middleware — injects Authorization and x-authenticated-user-token
// headers from the server session before forwarding to downstream services.
// Proactively refreshes the token if it expires within 5 minutes.
// ---------------------------------------------------------------------------
async function injectSessionToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.session.accessToken) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  // Proactive refresh: if within 5 minutes of expiry, refresh now
  if (req.session.expiresAt && Date.now() > req.session.expiresAt - 5 * 60 * 1000) {
    try {
      const refreshed = await refreshSessionToken(req.session.refreshToken!);
      req.session.accessToken = refreshed.access_token;
      req.session.refreshToken = refreshed.refresh_token;
      req.session.expiresAt = Date.now() + refreshed.expires_in * 1000;
      if (refreshed.id_token) req.session.idToken = refreshed.id_token;
      req.session.cookie.maxAge = refreshed.expires_in * 1000;
    } catch {
      req.session.destroy(() => {});
      res.status(401).json({ error: 'Session expired — please log in again' });
      return;
    }
  }

  req.headers['authorization'] = `Bearer ${req.session.accessToken}`;
  req.headers['x-authenticated-user-token'] = req.session.accessToken;
  next();
}

// ---------------------------------------------------------------------------
// retryOn401 — wraps a proxy handler to retry once after refreshing the token
// if the downstream service returns 401 (handles clock drift / revoked tokens).
// ---------------------------------------------------------------------------
function retryOn401(proxy: RequestHandler): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    let retried = false;

    // Intercept the proxy response via the onProxyRes hook attached to the proxy.
    // http-proxy-middleware v3 exposes this via the middleware itself, so we
    // use a patched res.writeHead to detect 401 before headers are flushed.
    const originalWriteHead = res.writeHead.bind(res);

    (res as any).writeHead = async function (statusCode: number, ...args: any[]) {
      if (statusCode === 401 && !retried && req.session.refreshToken) {
        retried = true;
        try {
          const refreshed = await refreshSessionToken(req.session.refreshToken);
          req.session.accessToken = refreshed.access_token;
          req.session.refreshToken = refreshed.refresh_token;
          req.session.expiresAt = Date.now() + refreshed.expires_in * 1000;
          if (refreshed.id_token) req.session.idToken = refreshed.id_token;
          req.headers['authorization'] = `Bearer ${refreshed.access_token}`;
          req.headers['x-authenticated-user-token'] = refreshed.access_token;
          // Restore writeHead and re-proxy
          res.writeHead = originalWriteHead;
          proxy(req, res, next);
          return;
        } catch {
          req.session.destroy(() => {});
          res.writeHead = originalWriteHead;
          originalWriteHead(401);
          res.end(JSON.stringify({ error: 'Session expired — please log in again' }));
          return;
        }
      }
      return originalWriteHead(statusCode, ...args);
    };

    proxy(req, res, next);
  };
}

// ---------------------------------------------------------------------------
// Auth token endpoints
// Secrets live here on the server — never in the frontend bundle.
// ---------------------------------------------------------------------------

// POST /auth/token
// Exchanges authorization_code for tokens, stores them in the session,
// then returns only { email, name } to the browser.
app.post('/auth/token', express.urlencoded({ extended: false }), express.json(), async (req: Request, res: Response) => {
  const { grant_type, code, redirect_uri } = req.body;

  const clientId = process.env.VITE_OAUTH2_CLIENT_ID;
  const clientSecret = process.env.OAUTH2_CLIENT_SECRET;
  const hydraUrl = hydraPublicUrl();

  if (!clientId || !clientSecret) {
    res.status(500).json({ error: 'OAuth2 client credentials not configured on server' });
    return;
  }

  if (grant_type !== 'authorization_code') {
    res.status(400).json({ error: 'Only authorization_code grant is supported on this endpoint' });
    return;
  }

  if (!code || !redirect_uri) {
    res.status(400).json({ error: 'code and redirect_uri are required' });
    return;
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch(`${hydraUrl}/oauth2/token`, {
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

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[/auth/token] Hydra token exchange failed:', err);
      res.status(tokenRes.status).json({ error: 'Token exchange failed' });
      return;
    }

    const tokens = await tokenRes.json();

    // Fetch user identity from Hydra userinfo endpoint
    let userEmail = '';
    let userName = '';
    try {
      const uiRes = await fetch(`${hydraUrl}/userinfo`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (uiRes.ok) {
        const ui = await uiRes.json();
        userEmail = ui.email || ui.preferred_username || '';
        userName = ui.name || [ui.given_name, ui.family_name].filter(Boolean).join(' ') || '';
      }
    } catch (e) {
      console.warn('[/auth/token] userinfo fetch failed:', e);
    }

    // Fallback: decode email/name from the id_token payload
    if (!userEmail && tokens.id_token) {
      try {
        const payload = JSON.parse(
          Buffer.from(tokens.id_token.split('.')[1], 'base64').toString('utf8')
        );
        userEmail = payload.email || payload.preferred_username || payload.sub || '';
        userName = userName || payload.name || '';
      } catch { /* ignore */ }
    }

    // Store tokens in the server session — browser never sees them
    req.session.accessToken = tokens.access_token;
    req.session.refreshToken = tokens.refresh_token;
    req.session.idToken = tokens.id_token || '';
    req.session.expiresAt = Date.now() + (tokens.expires_in || 3600) * 1000;
    req.session.userEmail = userEmail;
    req.session.userName = userName;

    // Return only non-sensitive identity to the browser
    res.json({ email: userEmail, name: userName });
  } catch (err) {
    console.error('[/auth/token] request failed:', err);
    res.status(502).json({ error: 'Failed to reach Hydra token endpoint' });
  }
});

// POST /auth/ext-token
// Exchanges authorization_code with the external OIDC provider, absorbs the
// userinfo call server-side, stores interim identity in session, and returns
// only { email, name, sub } to the browser.
app.post('/auth/ext-token', express.urlencoded({ extended: false }), express.json(), async (req: Request, res: Response) => {
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
    const tokenRes = await fetch(`${extOidcBaseUrl}/oauth2/token`, {
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

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[/auth/ext-token] External OIDC token exchange failed:', err);
      res.status(tokenRes.status).json({ error: 'External token exchange failed' });
      return;
    }

    const extTokens = await tokenRes.json();

    // Decode external id_token for claims
    let extIdClaims: Record<string, any> = {};
    if (extTokens.id_token) {
      try {
        extIdClaims = JSON.parse(
          Buffer.from(extTokens.id_token.split('.')[1], 'base64').toString('utf8')
        );
      } catch { /* ignore */ }
    }

    // Fetch userinfo from external IdP server-side — browser never sees the ext access_token
    let userInfo: Record<string, any> = {};
    try {
      const uiRes = await fetch(`${extOidcBaseUrl}/userinfo`, {
        headers: { Authorization: `Bearer ${extTokens.access_token}` },
      });
      if (uiRes.ok) {
        userInfo = await uiRes.json();
      }
    } catch (e) {
      console.warn('[/auth/ext-token] userinfo fetch failed:', e);
    }

    // Normalize email — same logic as the former Callback.tsx ext branch
    let userEmail =
      userInfo.email || extIdClaims.email ||
      userInfo.preferred_username || extIdClaims.preferred_username ||
      userInfo.login || userInfo.username || userInfo.uid ||
      extIdClaims.sub || userInfo.sub ||
      'unknown';

    if (/^\d+$/.test(userEmail)) {
      userEmail = `${userEmail}@rc.local`;
    }

    const userName =
      userInfo.name || extIdClaims.name ||
      [userInfo.given_name, userInfo.family_name].filter(Boolean).join(' ') ||
      [extIdClaims.given_name, extIdClaims.family_name].filter(Boolean).join(' ') ||
      '';

    const sub = extIdClaims.sub || userInfo.sub || '';

    // Store interim identity in session — no Hydra token yet at this stage
    req.session.userEmail = userEmail;
    req.session.userName = userName;

    // Return only identity claims — the ext access_token never leaves the server
    res.json({ email: userEmail, name: userName, sub });
  } catch (err) {
    console.error('[/auth/ext-token] request failed:', err);
    res.status(502).json({ error: 'Failed to reach external OIDC token endpoint' });
  }
});

// ---------------------------------------------------------------------------
// Hydra Admin endpoints — server-side only, Hydra admin URL never reaches browser.
// ---------------------------------------------------------------------------

// GET /auth/hydra-consent-request?consent_challenge=...
app.get('/auth/hydra-consent-request', async (req: Request, res: Response) => {
  const consent_challenge = req.query.consent_challenge as string;
  if (!consent_challenge) {
    res.status(400).json({ error: 'consent_challenge is required' });
    return;
  }
  try {
    const r = await fetch(
      `${hydraAdminUrl()}/admin/oauth2/auth/requests/consent?consent_challenge=${encodeURIComponent(consent_challenge)}`
    );
    res.status(r.status).json(await r.json());
  } catch (err) {
    console.error('[/auth/hydra-consent-request] Hydra request failed:', err);
    res.status(502).json({ error: 'Failed to reach Hydra admin' });
  }
});

// POST /auth/hydra-accept-login
app.post('/auth/hydra-accept-login', express.json(), async (req: Request, res: Response) => {
  const { login_challenge, subject, remember, remember_for, context } = req.body;
  if (!login_challenge || !subject) {
    res.status(400).json({ error: 'login_challenge and subject are required' });
    return;
  }
  try {
    const r = await fetch(
      `${hydraAdminUrl()}/admin/oauth2/auth/requests/login/accept?login_challenge=${encodeURIComponent(login_challenge)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, remember, remember_for, context }),
      }
    );
    res.status(r.status).json(await r.json());
  } catch (err) {
    console.error('[/auth/hydra-accept-login] Hydra request failed:', err);
    res.status(502).json({ error: 'Failed to reach Hydra admin' });
  }
});

// POST /auth/hydra-accept-consent
app.post('/auth/hydra-accept-consent', express.json(), async (req: Request, res: Response) => {
  const { consent_challenge, ...body } = req.body;
  if (!consent_challenge) {
    res.status(400).json({ error: 'consent_challenge is required' });
    return;
  }
  try {
    const r = await fetch(
      `${hydraAdminUrl()}/admin/oauth2/auth/requests/consent/accept?consent_challenge=${encodeURIComponent(consent_challenge)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    res.status(r.status).json(await r.json());
  } catch (err) {
    console.error('[/auth/hydra-accept-consent] Hydra request failed:', err);
    res.status(502).json({ error: 'Failed to reach Hydra admin' });
  }
});

// POST /auth/hydra-reject-consent
app.post('/auth/hydra-reject-consent', express.json(), async (req: Request, res: Response) => {
  const { consent_challenge, ...body } = req.body;
  if (!consent_challenge) {
    res.status(400).json({ error: 'consent_challenge is required' });
    return;
  }
  try {
    const r = await fetch(
      `${hydraAdminUrl()}/admin/oauth2/auth/requests/consent/reject?consent_challenge=${encodeURIComponent(consent_challenge)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    res.status(r.status).json(await r.json());
  } catch (err) {
    console.error('[/auth/hydra-reject-consent] Hydra request failed:', err);
    res.status(502).json({ error: 'Failed to reach Hydra admin' });
  }
});

// POST /auth/hydra-accept-logout
// Accepts the Hydra logout challenge and destroys the Express session.
app.post('/auth/hydra-accept-logout', express.json(), async (req: Request, res: Response) => {
  const { logout_challenge } = req.body;
  if (!logout_challenge) {
    res.status(400).json({ error: 'logout_challenge is required' });
    return;
  }
  try {
    const r = await fetch(
      `${hydraAdminUrl()}/admin/oauth2/auth/requests/logout/accept?logout_challenge=${encodeURIComponent(logout_challenge)}`,
      { method: 'PUT' }
    );
    const data = await r.json();
    // Destroy the Express session so the database record is cleaned up
    req.session.destroy(() => {});
    res.status(r.status).json(data);
  } catch (err) {
    console.error('[/auth/hydra-accept-logout] Hydra request failed:', err);
    res.status(502).json({ error: 'Failed to reach Hydra admin' });
  }
});

// ---------------------------------------------------------------------------
// Session management endpoints
// ---------------------------------------------------------------------------

// GET /auth/me — returns current session identity without exposing tokens
app.get('/auth/me', (req: Request, res: Response) => {
  if (!req.session.accessToken || !req.session.expiresAt || Date.now() > req.session.expiresAt) {
    res.json({ authenticated: false });
    return;
  }
  res.json({
    authenticated: true,
    email: req.session.userEmail,
    name: req.session.userName,
    idToken: req.session.idToken || null,
  });
});

// POST /auth/logout — destroys the Express session and clears the cookie
app.post('/auth/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('[/auth/logout] session destroy failed:', err);
    }
    res.clearCookie('rc-session');
    res.json({ ok: true });
  });
});

// ---------------------------------------------------------------------------
// Proxy routes — mirrors vite.config.ts proxy config so the same paths work
// in production. Order matters: more specific paths must be registered first.
// ---------------------------------------------------------------------------

// Ory Hydra Public API
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

// Registry API — requires a valid session; token injected by middleware
// Express strips the mount path (/registry/api) before handing off to the proxy,
// so pathRewrite adds it back → target receives the full /registry/api/v1/... path.
const registryProxy = createProxyMiddleware({
  target: process.env.API_BASE_URL || 'http://localhost:8081',
  changeOrigin: true,
  pathRewrite: (path) => '/api' + path,
});
app.use('/registry/api', injectSessionToken, retryOn401(registryProxy));

// Backend API (general — no session requirement)
app.use(
  '/api',
  createProxyMiddleware({
    target: process.env.API_BASE_URL || 'http://localhost:8081',
    changeOrigin: true,
  })
);

// Credential service — requires a valid session; token injected by middleware
const credentialProxy = createProxyMiddleware({
  target: process.env.CREDENTIAL_SERVICE_URL || 'http://localhost:3005',
  changeOrigin: true,
});
app.use('/credential', injectSessionToken, retryOn401(credentialProxy));

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
