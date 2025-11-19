import { Sun, Moon, User, Languages, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
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
  const [language, setLanguage] = useState("English");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we should show search bar
  const showSearchBar = location.pathname.startsWith("/entity/new") || 
                        location.pathname.startsWith("/profile") ||
                        (location.pathname.match(/^\/entity\/[^/]+$/) && !location.pathname.endsWith("/edit")) ||
                        location.pathname.match(/^\/entity\/[^/]+\/edit$/);

  const isProfilePage = location.pathname === "/profile";

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
    <header className="h-20 border-b-2 border-border bg-card flex items-center justify-between px-6 shadow-md">
      {showSearchBar ? (
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="relative">
            {isSearching ? (
              <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-spin" />
            ) : (
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            )}
            <Input
              placeholder="Search for entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSearching}
              className="pl-12 pr-4 bg-background font-medium rounded-xl h-12 border-2 border-input hover:border-primary/50 focus:border-primary transition-all text-base shadow-sm"
            />
          </div>
        </form>
      ) : (
        title && <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      )}
      <div className="flex items-center gap-3 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-lg transition-colors"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>

        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-36 font-semibold text-foreground border-input rounded-lg hover:border-primary transition-colors">
            <SelectValue>
              <div className="flex items-center gap-2">
                {language === "English" ? (
                  <span className="text-base">🇬🇧</span>
                ) : (
                  <span className="text-base">🇫🇷</span>
                )}
                <span>{language}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="English">
              <div className="flex items-center gap-2">
                <span className="text-base">🇬🇧</span>
                <span>English</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className={cn(
                  "flex items-center gap-3 transition-all focus:outline-none rounded-lg px-3 py-2 border-2",
                  isProfilePage 
                    ? "bg-primary/10 border-primary/20 ring-2 ring-primary/20" 
                    : "border-transparent hover:bg-primary/10 hover:border-primary hover:text-primary"
                )}
              >
                <div className={cn(
                  "h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md transition-all",
                  isProfilePage && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}>
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{username}</p>
                  <p className="text-xs font-medium text-muted-foreground">Administrator</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover mt-2 p-2 shadow-xl border-2">
              <DropdownMenuItem 
                onClick={() => navigate("/profile")} 
                className="cursor-pointer py-3 px-4 rounded-lg hover:bg-accent transition-colors"
              >
                <User className="mr-3 h-5 w-5" />
                <span className="text-base font-medium">View Profile</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
