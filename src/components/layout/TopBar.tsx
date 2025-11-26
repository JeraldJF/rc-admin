import { Sun, Moon, User, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  title?: string;
}

export const TopBar = ({ title }: TopBarProps) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [username, setUsername] = useState("admin");
  const [userRole, setUserRole] = useState("admin");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  // Determine if we should show search bar
  const showSearchBar = location.pathname.startsWith("/entity/new") || 
                        location.pathname.startsWith("/profile") ||
                        (location.pathname.match(/^\/entity\/[^/]+$/) && !location.pathname.endsWith("/edit")) ||
                        location.pathname.match(/^\/entity\/[^/]+\/edit$/);

  const isProfilePage = location.pathname === "/profile";

  // Get role display name
  const getRoleDisplay = (role: string) => {
    if (role === "admin") return "Administrator";
    if (role === "teacher") return "Teacher";
    if (role === "student") return "Student";
    return "User";
  };

  // Get search placeholder based on role
  const getSearchPlaceholder = (role: string) => {
    if (role === "admin") return t("search.teachers");
    if (role === "teacher") return t("search.students");
    if (role === "student") return t("search.claims");
    return t("search.default");
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
      const emailUsername = userEmail.split("@")[0];
      setUsername(emailUsername);
    }
    
    const role = localStorage.getItem("userRole") || "admin";
    setUserRole(role);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      navigate(`/registry?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearching(false);
    }
  };

  return (
  <header className="h-16 border-b bg-background/70 backdrop-blur-sm flex items-center justify-between px-6 shadow-sm">
      {showSearchBar ? (
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              placeholder={getSearchPlaceholder(userRole)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSearching}
              className="pl-10 pr-4 bg-background font-medium"
            />
          </div>
        </form>
      ) : (
        title && <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      )}
      <div className="flex items-center gap-4 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>

        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-36 font-medium text-foreground bg-secondary/80 border border-border rounded-md h-10 px-3 focus:outline-none focus:ring-2 focus:ring-primary/40">
            <SelectValue>
              <div className="flex items-center gap-2">
                {language === "en" ? (
                  <span className="text-lg">🇺🇸</span>
                ) : (
                  <span className="text-lg">🇪🇸</span>
                )}
                <span>{t(`lang.${language === "en" ? "english" : "spanish"}`)}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">
              <div className="flex items-center gap-2">
                <span className="text-lg">🇺🇸</span>
                <span>{t("lang.english")}</span>
              </div>
            </SelectItem>
            <SelectItem value="es">
              <div className="flex items-center gap-2">
                <span className="text-lg">🇪🇸</span>
                <span>{t("lang.spanish")}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-3 pl-4 border-l">
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={userRole === "admin" || userRole === "student"}>
              <button 
                className={cn(
                  "flex items-center gap-3 transition-colors focus:outline-none",
                  (userRole === "admin" || userRole === "student") ? "opacity-50 cursor-not-allowed" : "hover:text-primary"
                )}
                disabled={userRole === "admin" || userRole === "student"}
              >
                <div className={cn(
                  "h-8 w-8 rounded-full bg-primary flex items-center justify-center",
                  isProfilePage && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}>
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{username}</p>
                  <p className="text-xs text-muted-foreground">{getRoleDisplay(userRole)}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>{t("profile.view_profile")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
