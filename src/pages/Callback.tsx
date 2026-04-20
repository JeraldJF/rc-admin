import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { rewriteHydraRedirect } from '../lib/oauth2';
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
        try {
          // Server verifies state against the session it stored in /auth/ext-redirect.
          const tokenResponse = await fetch('/auth/ext-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ code, state }),
            credentials: 'include',
          });

          if (!tokenResponse.ok) {
            throw new Error(`External token exchange failed: ${await tokenResponse.text()}`);
          }

          const { email: userEmail, name: userName } = await tokenResponse.json();

          // Role lookup is skipped here — no Hydra token exists yet at this stage.
          // The real role is fetched after the full Hydra flow completes (Step 15).
          // Per design Q2: default to 'employee'; Hydra login context carries it forward.
          const userRole = 'employee';

          const loginChallenge = sessionStorage.getItem('login_challenge');
          if (!loginChallenge) {
            throw new Error('Login challenge not found. Please restart the login flow.');
          }

          const acceptRes = await fetch('/auth/hydra-accept-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              login_challenge: loginChallenge,
              subject: userEmail,
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
        sessionStorage.removeItem('oauth2_state');

        // Server exchanges the code, calls Hydra userinfo, stores tokens in the
        // server session, and returns only {email, name} — no tokens in the browser.
        const tokenRes = await fetch('/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri: getConfig().VITE_OAUTH2_REDIRECT_URI || 'http://localhost:3000/callback',
          }),
          credentials: 'include',
        });

        if (!tokenRes.ok) {
          throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
        }

        const { email, name } = await tokenRes.json();

        // Store non-sensitive display values — no tokens in sessionStorage
        sessionStorage.setItem('isLoggedIn', 'true');
        if (email) sessionStorage.setItem('userEmail', email);
        if (name) sessionStorage.setItem('userName', name);

        // Look up role and osid from the server — it uses the session token directly
        // and does the Registry search server-side (no raw employee data in the browser).
        const roleRes = await fetch('/auth/role', { credentials: 'include' });
        if (!roleRes.ok) throw new Error(`Role lookup failed: ${await roleRes.text()}`);
        const { role: rcRole, osid: rcOsid } = await roleRes.json();
        console.log('[Callback] Role lookup result:', { rcRole, rcOsid });

        if (rcOsid) sessionStorage.setItem('employeeOsid', rcOsid);
        const role = (rcRole || 'employee').toLowerCase();
        sessionStorage.setItem('userRole', role);

        console.log('[Callback] Final navigation decision:', { role, email });
        if (role === 'admin') {
          navigate('/registry');
        } else {
          navigate('/profile');
        }
      } catch (err) {
        console.error('Token exchange error:', err);
        setError('Failed to complete login');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
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
