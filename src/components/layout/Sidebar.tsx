import { Database, LogOut, ClipboardList, CheckCircle, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export const Sidebar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "admin";
    setUserRole(role);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    toast({
      title: "👋 Logged out",
      description: "You have been successfully logged out.",
      variant: "error",
    });
    navigate("/login");
  };

  return (
    <aside className="w-64 border-r border-border bg-card h-screen flex flex-col fixed left-0 top-0 shadow-lg">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Database className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">RC Admin</h1>
        </div>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        {userRole === "student" ? (
          <>
            <NavLink
              to="/claims"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground font-medium hover:bg-primary/5 hover:text-primary transition-all duration-200"
              activeClassName="bg-primary/10 text-primary font-semibold shadow-sm"
            >
              <ClipboardList className="h-5 w-5" />
              <span>Claims</span>
            </NavLink>
            <NavLink
              to="/profile"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground font-medium hover:bg-primary/5 hover:text-primary transition-all duration-200 mt-2"
              activeClassName="bg-primary/10 text-primary font-semibold shadow-sm"
            >
              <User className="h-5 w-5" />
              <span>View Profile</span>
            </NavLink>
          </>
        ) : userRole === "teacher" ? (
          <>
            <NavLink
              to="/registry"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground font-medium hover:bg-primary/5 hover:text-primary transition-all duration-200"
              activeClassName="bg-primary/10 text-primary font-semibold shadow-sm"
            >
              <Database className="h-5 w-5" />
              <span>Registry</span>
            </NavLink>
            <NavLink
              to="/pending-claims"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground font-medium hover:bg-primary/5 hover:text-primary transition-all duration-200 mt-2"
              activeClassName="bg-primary/10 text-primary font-semibold shadow-sm"
            >
              <ClipboardList className="h-5 w-5" />
              <span>Pending Claims</span>
            </NavLink>
            <NavLink
              to="/approved-claims"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground font-medium hover:bg-primary/5 hover:text-primary transition-all duration-200 mt-2"
              activeClassName="bg-primary/10 text-primary font-semibold shadow-sm"
            >
              <CheckCircle className="h-5 w-5" />
              <span>Approved Claims</span>
            </NavLink>
          </>
        ) : (
          <NavLink
            to="/registry"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground font-medium hover:bg-primary/5 hover:text-primary transition-all duration-200"
            activeClassName="bg-primary/10 text-primary font-semibold shadow-sm"
          >
            <Database className="h-5 w-5" />
            <span>Registry</span>
          </NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-border mt-auto bg-muted/30">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground font-medium hover:bg-destructive/10 hover:text-destructive transition-all duration-200 w-full"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
