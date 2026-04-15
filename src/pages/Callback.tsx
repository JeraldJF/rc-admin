import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { oauth2Service, rewriteHydraRedirect } from '../lib/oauth2';
import { lookupEmployeeRole } from '../lib/roleService';
import { getConfig } from '../lib/config';

export default function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for OAuth2 errors first
      if (error) {
        setError(`OAuth2 Error: ${error} - ${errorDescription || 'Unknown error'}`);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        return;
      }

      // ---- External OIDC flow (state starts with "ext_") ----
      if (state?.startsWith('ext_')) {
        const savedExtState = sessionStorage.getItem('external_oidc_state');
        if (state !== savedExtState) {
          setError('Invalid state parameter - possible CSRF attack');
          return;
        }

        try {
          sessionStorage.removeItem('external_oidc_state');

          // Exchange code via our server-side endpoint so client_id + client_secret
          // never appear in the browser bundle.
          const tokenResponse = await fetch('/auth/ext-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              code,
              redirect_uri: getConfig().VITE_EXT_OIDC_REDIRECT_URI || 'http://localhost:3000/callback',
            }),
          });

          if (!tokenResponse.ok) {
            throw new Error(`External token exchange failed: ${await tokenResponse.text()}`);
          }

          const extTokens = await tokenResponse.json();

          // Decode external id_token (always has sub; may have email/name if 'email profile' scope granted)
          let extIdClaims: any = {};
          if (extTokens.id_token) {
            try {
              const parts = extTokens.id_token.split('.');
              const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
              extIdClaims = JSON.parse(decodeURIComponent(atob(b64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
              ).join('')));
            } catch (e) {
              // Could not decode external id_token
            }
          }

          // Get user info from external IdP
          const userInfoResponse = await fetch('/ext-oidc/userinfo', {
            headers: { Authorization: `Bearer ${extTokens.access_token}` },
          });

          let userInfo: any = {};
          if (userInfoResponse.ok) {
            userInfo = await userInfoResponse.json();
          }

          // Try all possible field names different IdPs use for email and subject
          let userEmail = userInfo.email || extIdClaims.email
            || userInfo.preferred_username || extIdClaims.preferred_username
            || userInfo.login || userInfo.username || userInfo.uid
            || extIdClaims.sub || userInfo.sub
            || 'unknown';
          // Normalize: if the IdP returned a pure numeric personal ID (no @),
          // append @rc.local so it matches the RC registry record.
          if (/^\d+$/.test(userEmail)) {
            userEmail = `${userEmail}@rc.local`;
          }
          const userName = userInfo.name || extIdClaims.name
            || [userInfo.given_name, userInfo.family_name].filter(Boolean).join(' ')
            || [extIdClaims.given_name, extIdClaims.family_name].filter(Boolean).join(' ')
            || '';

          // Look up employee role and osid from Registry API
          const { role: userRole, osid: employeeOsid } = await lookupEmployeeRole(userEmail);
          if (employeeOsid) {
            sessionStorage.setItem('employeeOsid', employeeOsid);
          }

          const loginChallenge = sessionStorage.getItem('login_challenge');
          if (!loginChallenge) {
            throw new Error('Login challenge not found. Please restart the login flow.');
          }

          // Accept Hydra login challenge with the external user's identity
          const acceptRes = await fetch('/auth/hydra-accept-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              login_challenge: loginChallenge,
              subject: userEmail,  // Must match contactDetails.email for registry ownership
              remember: true,
              remember_for: 3600,
              context: { email: userEmail, role: userRole, name: userName },
            }),
          });

          if (!acceptRes.ok) {
            throw new Error(`Failed to accept Hydra login: ${await acceptRes.text()}`);
          }

          const { redirect_to } = await acceptRes.json();
          sessionStorage.removeItem('login_challenge');

          sessionStorage.setItem('userEmail', userEmail);
          sessionStorage.setItem('userRole', userRole);
          if (userName) sessionStorage.setItem('userName', userName);

          // Follow Hydra's redirect via the proxy so CSRF cookie origin matches
          window.location.href = rewriteHydraRedirect(redirect_to);
        } catch (err: any) {
          console.error('External OIDC callback error:', err);
          setError(err.message || 'External login failed');
        }
        return;
      }

      // ---- Internal Hydra OAuth2 flow ----
      const savedState = sessionStorage.getItem('oauth2_state');
      if (state !== savedState) {
        setError('Invalid state parameter - possible CSRF attack');
        return;
      }

      try {
        // Exchange code for tokens
        const tokens = await oauth2Service.exchangeCodeForToken(code);

        // Clear any stale tokens before storing new ones
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('id_token');

        // Store tokens
        sessionStorage.setItem('accessToken', tokens.access_token);
        sessionStorage.setItem('refreshToken', tokens.refresh_token);
        sessionStorage.setItem('isLoggedIn', 'true');
        if (tokens.id_token) {
          sessionStorage.setItem('id_token', tokens.id_token);
        }

        // Clean up
        sessionStorage.removeItem('oauth2_state');

        // Helper: decode a JWT payload
        const decodeJwt = (token: string) => {
          const parts = token.split('.');
          if (parts.length !== 3) return null;
          try {
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const json = decodeURIComponent(atob(base64).split('').map(c =>
              '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join(''));
            return JSON.parse(json);
          } catch { return null; }
        };

        const accessPayload = decodeJwt(tokens.access_token);
        const idPayload = tokens.id_token ? decodeJwt(tokens.id_token) : null;

        // Call Hydra userinfo endpoint for ground-truth claims
        let userInfoClaims: any = {};
        try {
          const uiRes = await fetch('/ory/hydra/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          if (uiRes.ok) {
            userInfoClaims = await uiRes.json();
          }
        } catch (e) {
          // UserInfo fetch failed
        }

        // Merge: prefer non-"unknown" values; priority: userinfo > id_token > access_token > sessionStorage
        const pick = (...vals: (string | undefined | null)[]) =>
          vals.find(v => v && v !== 'unknown') ?? '';

        const email = pick(
          userInfoClaims.email,
          idPayload?.email,
          accessPayload?.email, accessPayload?.ext?.email,
          sessionStorage.getItem('userEmail'),
        );
        const name = pick(
          userInfoClaims.name,
          idPayload?.name,
          accessPayload?.name,
          sessionStorage.getItem('userName'),
        );
        let role = pick(
          userInfoClaims.role,
          idPayload?.role,
          accessPayload?.role, accessPayload?.ext?.role,
          sessionStorage.getItem('userRole'),
        );

        console.log('[Callback] Initial role from JWT/sessionStorage:', role);

        if (email) sessionStorage.setItem('userEmail', email);
        if (name) sessionStorage.setItem('userName', name);

        // Look up role and osid from Registry API (primary source of truth)
        console.log('[Callback] Looking up role for email:', email);
        const { role: rcRole, osid: rcOsid } = await lookupEmployeeRole(email);
        console.log('[Callback] Registry lookup result:', { rcRole, rcOsid });

        if (rcOsid) {
          sessionStorage.setItem('employeeOsid', rcOsid);
        }

        // Use registry role if found, otherwise fall back to JWT role
        role = (rcRole || role || 'employee').toLowerCase();
        sessionStorage.setItem('userRole', role);

        console.log('[Callback] Final navigation decision:', { role, rcRole, email });
        console.log('[Callback] SessionStorage userRole:', sessionStorage.getItem('userRole'));

        if (role === 'admin') {
          console.log('[Callback] Navigating to /registry (admin)');
          navigate('/registry');
        } else {
          console.log('[Callback] Navigating to /profile (employee)');
          navigate('/profile');
        }
        return;
      } catch (err) {
        console.error('Token exchange error:', err);
        setError('Failed to complete login');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    // Handle "User Denied Access" gracefully
    if (error.includes('access_denied')) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🛑</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Login Canceled</h3>
            <p className="text-sm text-slate-600">
              You denied the access request. To continue, you must authorize the application.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors font-medium"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }

    // Default error view
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 bg-red-50 p-4 rounded border border-red-200">
          <strong>Authentication Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="text-slate-600 font-medium">Finalizing secure connection...</p>
      </div>
    </div>
  );
}
