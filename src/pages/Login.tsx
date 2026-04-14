import { useState, useEffect } from "react";
import { oryService } from '@/lib/ory';
import { rewriteHydraRedirect } from '@/lib/oauth2';
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lookupEmployeeRole } from '@/lib/roleService';

// Login flow:
//   1. Hydra sends login_challenge → check for existing Kratos session
//      a. Session found  → accept Hydra challenge silently (no button shown)
//      b. No session     → show landing page with "Login with IDP" button
//   2. Button click → redirect to external IdP OAuth2
//   3. External IdP authenticates → redirects to /callback (Callback.tsx)
//   4. No challenge anywhere → show landing page, button starts fresh Hydra flow

const HYDRA_ADMIN  = import.meta.env.VITE_ORY_HYDRA_ADMIN  || 'http://localhost:4445';
const EXT_AUTH_URL = 'https://cuenta.digital.gob.do/oauth2/auth';
const EXT_IDP_NAME = 'cuenta.digital.gob.do';

const Login = () => {
  const [searchParams] = useSearchParams();
  const loginChallenge = searchParams.get('login_challenge');
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState("Connecting...");

  const acceptHydraChallenge = async (challenge: string, subjectId: string, traits: any) => {
    const userEmail = traits?.email || subjectId;

    // Look up the real role from the registry API
    const { role: userRole, osid } = await lookupEmployeeRole(userEmail);
    if (osid) {
      sessionStorage.setItem('employeeOsid', osid);
    }

    const res = await fetch(
      `${HYDRA_ADMIN}/admin/oauth2/auth/requests/login/accept?login_challenge=${challenge}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: userEmail,
          remember: true,
          remember_for: 3600,
          context: { email: userEmail, role: userRole, name: traits?.name },
        }),
      }
    );

    if (res.ok) {
      const { redirect_to } = await res.json();
      sessionStorage.removeItem('login_challenge');
      window.location.href = rewriteHydraRedirect(redirect_to);
    } else {
      throw new Error('Failed to accept login challenge: ' + await res.text());
    }
  };

  const redirectToExternalIdP = () => {
    const extState = 'ext_' + Math.random().toString(36).substring(2, 15)
                            + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('external_oidc_state', extState);

    const authUrl = new URL(EXT_AUTH_URL);
    authUrl.searchParams.set('client_id',     import.meta.env.VITE_EXT_OIDC_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri',  import.meta.env.VITE_EXT_OIDC_REDIRECT_URI || 'http://localhost:3000/callback');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope',         'openid offline_access email profile');
    authUrl.searchParams.set('state',         extState);

    window.location.href = authUrl.toString();
  };

  useEffect(() => {
    const init = async () => {
      const storedChallenge = sessionStorage.getItem('login_challenge');

      // Case 1: Hydra sent a fresh login_challenge
      if (loginChallenge) {
        sessionStorage.setItem('login_challenge', loginChallenge);

        // Re-use an existing Kratos session so the user is not asked to log in again
        const session = await oryService.getSession();
        if (session) {
          setStatus("Resuming session...");
          const traits = session.identity.traits || {};
          if (traits.email) sessionStorage.setItem('userEmail', traits.email);
          const name = traits.name
            ? (typeof traits.name === 'object'
                ? `${traits.name.first || ''} ${traits.name.last || ''}`.trim()
                : traits.name)
            : traits.username || '';
          if (name) sessionStorage.setItem('userName', name);
          await acceptHydraChallenge(loginChallenge, session.identity.id, traits);
          return;
        }

        // No active session — auto-redirect to external IdP (challenge already in hand)
        redirectToExternalIdP();
        return;
      }

      // Case 2: Returning to /login after an external-IdP round-trip that
      // landed here instead of /callback (e.g. from a return_to URL).
      if (storedChallenge) {
        try {
          const session = await oryService.getSession();
          if (session) {
            setStatus("Completing login...");
            const traits = session.identity.traits || {};
            if (traits.email) sessionStorage.setItem('userEmail', traits.email);
            const name = traits.name
              ? (typeof traits.name === 'object'
                  ? `${traits.name.first || ''} ${traits.name.last || ''}`.trim()
                  : traits.name)
              : traits.username || '';
            if (name) sessionStorage.setItem('userName', name);
            await acceptHydraChallenge(storedChallenge, session.identity.id, traits);
            return;
          }
        } catch (_) {
          // no session — fall through
        }
        sessionStorage.removeItem('login_challenge');
      }

      // Case 3: No challenge anywhere — check for existing Kratos session first
      try {
        const session = await oryService.getSession();
        if (session) {
          // Session exists (e.g. another tab is logged in) — start Hydra flow silently
          setStatus("Resuming session...");
          const { oauth2Service } = await import('../lib/oauth2');
          oauth2Service.startAuthFlow();
          return;
        }
      } catch (_) {
        // No session — fall through to show button
      }
      setChecking(false);
    };

    init();
  }, [loginChallenge]);

  const handleLogin = async () => {
    const storedChallenge = sessionStorage.getItem('login_challenge');
    if (storedChallenge) {
      // Challenge exists — go to external IdP for authentication
      redirectToExternalIdP();
    } else {
      // No challenge — start a fresh Hydra OAuth2 flow first
      const { oauth2Service } = await import('../lib/oauth2');
      oauth2Service.startAuthFlow();
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
          <h2 className="text-xl font-semibold">{status}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="flex flex-col items-center gap-8 p-10 bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome</h1>
          <p className="text-slate-400 text-sm">Sign in to access the registry</p>
        </div>
        <Button
          onClick={handleLogin}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          Login with {EXT_IDP_NAME}
        </Button>
      </div>
    </div>
  );
};

export default Login;
