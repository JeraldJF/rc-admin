import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const HYDRA_ADMIN = import.meta.env.VITE_ORY_HYDRA_ADMIN || 'http://localhost:4445';

export default function Logout() {
  const [searchParams] = useSearchParams();
  const logoutChallenge = searchParams.get('logout_challenge');

  useEffect(() => {
    if (!logoutChallenge) {
      window.location.href = '/login';
      return;
    }

    // Step 1: clear all local session data immediately
    sessionStorage.clear();

    // Step 2: accept the Hydra logout challenge (invalidates Hydra tokens)
    fetch(
      `${HYDRA_ADMIN}/admin/oauth2/auth/requests/logout/accept?logout_challenge=${logoutChallenge}`,
      { method: 'PUT' }
    )
      .then(() => {
        // Step 3: go directly to the React login page
        window.location.href = '/login';
      })
      .catch(() => {
        window.location.href = '/login';
      });
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
