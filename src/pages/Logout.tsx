import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const HYDRA_ADMIN = import.meta.env.VITE_ORY_HYDRA_ADMIN || 'http://localhost:4445';

export default function Logout() {
  const [searchParams] = useSearchParams();
  const logoutChallenge = searchParams.get('logout_challenge');

  useEffect(() => {
    const performLogout = async () => {
      // Step 1: Clear all local session data immediately
      sessionStorage.clear();
      localStorage.clear();

      // Step 2: If we have a logout challenge from Hydra, accept it
      if (logoutChallenge) {
        try {
          const response = await fetch(
            `${HYDRA_ADMIN}/admin/oauth2/auth/requests/logout/accept?logout_challenge=${logoutChallenge}`,
            { method: 'PUT' }
          );
          
          if (response.ok) {
            const data = await response.json();
            // Hydra returns a redirect_to URL after accepting logout
            if (data.redirect_to) {
              window.location.href = data.redirect_to;
              return;
            }
          }
        } catch (error) {
          console.error('Error accepting logout challenge:', error);
        }
      }

      window.location.href = '/login';
    };

    performLogout();
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
