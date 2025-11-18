import { Sun, Moon, User, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface TopBarProps {
  title?: string;
}

export const TopBar = ({ title }: TopBarProps) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [username, setUsername] = useState("admin");
  const [language, setLanguage] = useState("English");

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

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shadow-sm">
      {title && (
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      )}
      <div className="flex items-center gap-3 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-lg hover:bg-accent transition-colors"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5 text-primary" />
          ) : (
            <Sun className="h-5 w-5 text-amber-500" />
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
            <SelectItem value="French">
              <div className="flex items-center gap-2">
                <span className="text-base">🇫🇷</span>
                <span>French</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <User className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{username}</p>
            <p className="text-xs font-medium text-muted-foreground">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
};
