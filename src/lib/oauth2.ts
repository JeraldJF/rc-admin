import { Configuration, OAuth2Api } from '@ory/client';

// Helper to ensure no trailing slash
const stripTrailingSlash = (url: string) => url.replace(/\/$/, '');

const hydraConfig = new Configuration({
  basePath: stripTrailingSlash(import.meta.env.VITE_ORY_HYDRA_PUBLIC || "http://localhost:4444"),
  baseOptions: {
    withCredentials: true,
  },
});

export const hydraOAuth2 = new OAuth2Api(hydraConfig);

// Rewrites a Hydra-generated redirect_to URL (which uses Hydra's internal
// urls.self.public, e.g. http://localhost:4444) to go through the Vite proxy
// (VITE_ORY_HYDRA_PUBLIC, e.g. http://localhost:3000/ory/hydra).
// This ensures the CSRF cookie — set on the proxy origin — is sent correctly.
export const rewriteHydraRedirect = (redirectTo: string): string => {
  const hydraPublic = import.meta.env.VITE_ORY_HYDRA_PUBLIC;
  if (!hydraPublic) return redirectTo;
  try {
    const dest = new URL(redirectTo);
    const proxy = new URL(hydraPublic);
    // If they already share origin + base path, nothing to rewrite
    if (dest.origin === proxy.origin) return redirectTo;
    dest.protocol = proxy.protocol;
    dest.host = proxy.host;
    const proxyBase = proxy.pathname.replace(/\/$/, '');
    if (proxyBase) dest.pathname = proxyBase + dest.pathname;
    return dest.toString();
  } catch {
    return redirectTo;
  }
};

export const oauth2Service = {
  // Start OAuth2 flow
  startAuthFlow() {
    const clientId = import.meta.env.VITE_OAUTH2_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_OAUTH2_REDIRECT_URI || 'http://localhost:3000/callback';
    const scope = 'openid offline_access email profile';

    if (!clientId) {
      throw new Error('OAuth2 client ID not configured');
    }

    // Generate random state for CSRF protection (at least 8 characters)
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('oauth2_state', state);

    // Build authorization URL
    const authUrl = new URL(`${stripTrailingSlash(import.meta.env.VITE_ORY_HYDRA_PUBLIC || 'http://localhost:4444')}/oauth2/auth`);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('prompt', 'login');  // Force fresh login, never reuse Hydra remembered session

    window.location.href = authUrl.toString();
  },

  // Exchange authorization code for tokens
  async exchangeCodeForToken(code: string): Promise<{ access_token: string, refresh_token: string, id_token?: string }> {
    const clientId = import.meta.env.VITE_OAUTH2_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_OAUTH2_CLIENT_SECRET;
    const redirectUri = import.meta.env.VITE_OAUTH2_REDIRECT_URI || 'http://localhost:3000/callback';

    const response = await fetch(`${stripTrailingSlash(import.meta.env.VITE_ORY_HYDRA_PUBLIC || 'http://localhost:4444')}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    return await response.json();
  },

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    const clientId = import.meta.env.VITE_OAUTH2_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_OAUTH2_CLIENT_SECRET;

    const response = await fetch(`${stripTrailingSlash(import.meta.env.VITE_ORY_HYDRA_PUBLIC || 'http://localhost:4444')}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return await response.json();
  },
};
