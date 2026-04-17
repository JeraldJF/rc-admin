import { Database, LogOut, User } from "lucide-react";
import { getConfig } from "@/lib/config";
import { NavLink } from "@/components/NavLink";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export const Sidebar = () => {
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string>("");
  const { t } = useLanguage();

  useEffect(() => {
    const role = sessionStorage.getItem("userRole") || "admin";
    setUserRole(role);
  }, []);

  const handleLogout = async () => {
    toast({
      title: "Logging out...",
      description: "Ending your session...",
    });

    // Fetch idToken from server session before destroying it
    let idToken: string | null = null;
    try {
      const meRes = await fetch('/auth/me', { credentials: 'include' });
      if (meRes.ok) {
        const me = await meRes.json();
        idToken = me.idToken || null;
      }
    } catch { /* ignore */ }

    // Destroy the server session
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { /* ignore */ }

    localStorage.clear();
    sessionStorage.clear();

    const postLogoutUri = encodeURIComponent(window.location.origin + '/login');
    const hydraPublic = getConfig().VITE_ORY_HYDRA_PUBLIC || 'http://localhost:4444';

    if (idToken) {
      // Proper OIDC logout — invalidates Hydra session and all tokens
      window.location.href = `${hydraPublic}/oauth2/sessions/logout?id_token_hint=${idToken}&post_logout_redirect_uri=${postLogoutUri}`;
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-secondary via-secondary/60 to-background border-r border-border h-screen flex flex-col fixed left-0 top-0 shadow-lg">
      {/* Brand / Logo */}
      <div className="px-5 py-5 border-b border-border bg-gradient-to-br from-primary/5 via-accent/5 to-card backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center ring-1 ring-primary/20">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div className="leading-tight">
            <h1 className="text-lg font-bold tracking-tight text-foreground">RC Manager</h1>
            <p className="text-[11px] font-medium text-muted-foreground">{t("nav.certificates")}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-2">
        {userRole === "admin" ? (
          <NavLink
            to="/registry"
            className="relative flex items-center gap-3 px-3.5 py-3 rounded-lg text-foreground/75 font-medium border border-transparent hover:border-primary/30 hover:bg-primary/10 hover:text-primary transition-all duration-200 group"
            activeClassName="bg-primary/15 text-primary font-semibold border border-primary/40 shadow-sm before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1.5 before:rounded-full before:bg-primary"
          >
            <Database className="h-5 w-5 text-primary/80 group-hover:text-primary transition-colors" />
            <span>Employee List</span>
          </NavLink>
        ) : (
          // Employee View - Profile Only
          <NavLink
            to="/profile"
            className="relative flex items-center gap-3 px-3.5 py-3 rounded-lg text-foreground/75 font-medium border border-transparent hover:border-primary/30 hover:bg-primary/10 hover:text-primary transition-all duration-200 group"
            activeClassName="bg-primary/15 text-primary font-semibold border border-primary/40 shadow-sm before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1.5 before:rounded-full before:bg-primary"
          >
            <User className="h-5 w-5 text-info/80 group-hover:text-info transition-colors" />
            <span>My Profile</span>
          </NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3.5 py-3 rounded-lg text-foreground/80 font-medium border border-transparent hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition w-full group"
        >
          <LogOut className="h-5 w-5 text-destructive opacity-90 group-hover:opacity-100" />
          <span>{t("nav.logout")}</span>
        </button>
      </div>
    </aside>
  );
};
