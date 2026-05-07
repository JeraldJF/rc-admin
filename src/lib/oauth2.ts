import { Configuration, OAuth2Api } from '@ory/client';
import { getConfig } from './config';

const stripTrailingSlash = (url: string) => url.replace(/\/$/, '');

// Lazy singleton — created on first call so getConfig() is guaranteed to be loaded
let _hydraOAuth2: OAuth2Api | null = null;
export const getHydraOAuth2 = (): OAuth2Api => {
  if (!_hydraOAuth2) {
    _hydraOAuth2 = new OAuth2Api(new Configuration({
      basePath: stripTrailingSlash(getConfig().VITE_ORY_HYDRA_PUBLIC || 'http://localhost:4444'),
      baseOptions: { withCredentials: true },
    }));
  }
  return _hydraOAuth2;
};

// Rewrites a Hydra-generated redirect_to URL (which uses Hydra's internal
// urls.self.public) to go through the server proxy (VITE_ORY_HYDRA_PUBLIC).
// This ensures the CSRF cookie — set on the proxy origin — is sent correctly.
export const rewriteHydraRedirect = (redirectTo: string): string => {
  const hydraPublic = getConfig().VITE_ORY_HYDRA_PUBLIC;
  if (!hydraPublic) return redirectTo;
  try {
    const dest = new URL(redirectTo);
    const proxy = new URL(hydraPublic);
    const proxyBase = proxy.pathname.replace(/\/$/, '');
    // Already at the correct origin with the path prefix present — nothing to do.
    if (dest.origin === proxy.origin && (!proxyBase || dest.pathname.startsWith(proxyBase + '/'))) {
      return redirectTo;
    }
    dest.protocol = proxy.protocol;
    dest.host = proxy.host;
    if (proxyBase && !dest.pathname.startsWith(proxyBase + '/')) {
      dest.pathname = proxyBase + dest.pathname;
    }
    return dest.toString();
  } catch {
    return redirectTo;
  }
};

export const oauth2Service = {
  // Start OAuth2 flow — redirects to Hydra authorization endpoint
  startAuthFlow() {
    const { VITE_OAUTH2_CLIENT_ID: clientId, VITE_OAUTH2_REDIRECT_URI: redirectUri, VITE_ORY_HYDRA_PUBLIC: hydraPublic } = getConfig();

    if (!clientId) throw new Error('OAuth2 client ID not configured');

    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('oauth2_state', state);

    const authUrl = new URL(`${stripTrailingSlash(hydraPublic || 'http://localhost:4444')}/oauth2/auth`);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri || 'http://localhost:3000/callback');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'openid offline_access email profile');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('prompt', 'login');

    window.location.href = authUrl.toString();
  },
};
