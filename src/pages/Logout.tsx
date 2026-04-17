import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';


export default function Logout() {
  const [searchParams] = useSearchParams();
  const logoutChallenge = searchParams.get('logout_challenge');

  useEffect(() => {
    if (!logoutChallenge) {
      window.location.href = '/login';
      return;
    }

    const doLogout = async () => {
      // Destroy the Express session first so the database record is cleaned up
      try {
        await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
      } catch { /* ignore */ }

      // Clear local session state
      sessionStorage.clear();

      // Accept the Hydra logout challenge (invalidates Hydra tokens)
      try {
        await fetch('/auth/hydra-accept-logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logout_challenge: logoutChallenge }),
        });
      } catch { /* ignore */ }

      window.location.href = '/login';
    };

    doLogout();
  }, [logoutChallenge]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
        <h2 className="text-xl font-semibold">Signing out...</h2>
      </div>
    </div>
  );
}
