import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

// The external IdP (cuenta.digital.gob.do) is configured to redirect its
// settings flows here (e.g. after registration/verification to complete
// a user's profile). Forward the request to the external IdP's settings UI.
//
// Loop prevention: the external IdP's settings back/cancel button sends the
// user back to this URL (http://localhost:3000/settings?flow=<id>). We detect
// that by storing the forwarded flow ID in sessionStorage. On a second visit
// with the same flow ID we treat it as a "back/skip" and send the user to the
// main page instead of re-entering the loop.

const EXT_SETTINGS_URL = 'https://cuenta.digital.gob.do/ui/settings';

const Settings = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const flow = searchParams.get('flow');

    // Detect loop: we already forwarded this flow → user clicked back/skip
    const lastFlow = sessionStorage.getItem('settings_flow_forwarded');
    if (flow && flow === lastFlow) {
      sessionStorage.removeItem('settings_flow_forwarded');
      // User is already logged in — send them to the main page
      window.location.replace('/');
      return;
    }

    if (flow) sessionStorage.setItem('settings_flow_forwarded', flow);

    const target = new URL(EXT_SETTINGS_URL);
    if (flow) target.searchParams.set('flow', flow);
    // replace() instead of href so this page is NOT added to browser history.
    // That way the browser Back button from the external IdP skips this page
    // entirely and goes to whatever the user was on before settings.
    window.location.replace(target.toString());
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
        <h2 className="text-xl font-semibold">Redirecting to account settings...</h2>
      </div>
    </div>
  );
};

export default Settings;
