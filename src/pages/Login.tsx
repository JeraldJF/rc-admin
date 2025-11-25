import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Fingerprint, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loginApi, setAuthToken, searchStudentByEmail } from "@/lib/api";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "teacher" | "student">("admin");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordVisibilityToggle = () => {
    setShowPassword(true);
    setTimeout(() => {
      setShowPassword(false);
    }, 1000);
  };

  const validateField = (fieldName: "email" | "password", value: string) => {
    if (fieldName === "email") {
      if (!value) {
        return "Username is required";
      }
    }
    
    if (fieldName === "password") {
      if (!value) {
        return "Password is required";
      }
    }
    
    return "";
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailError = validateField("email", email);
    const passwordError = validateField("password", password);
    
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsLoading(true);
      
      try {
        // Call login API
        const response = await loginApi(email, password);
        
        // Store access token
        setAuthToken(response.access_token);
        
        // Store user details
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userRole", role);
        
        // If student, fetch and store their osid
        if (role === "student") {
          try {
            const searchResults = await searchStudentByEmail(email);
            if (searchResults && searchResults.length > 0) {
              const studentOsid = searchResults[0].osid;
              localStorage.setItem("studentOsid", studentOsid);
            }
          } catch (error) {
            console.error("Failed to fetch student osid:", error);
            // Continue with login even if osid fetch fails
          }
        }
        
        toast({
          title: "🎉 Login successful",
          description: "Welcome back!",
          variant: "success",
        });
        
        // Navigate based on role
        if (role === "student") {
          navigate("/claims");
        } else {
          navigate("/registry");
        }
      } catch (error) {
        toast({
          title: "❌ Login failed",
          description: error instanceof Error ? error.message : "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-secondary via-background to-muted">
      <Card className="w-full max-w-md shadow-xl border border-border/70 bg-card/95 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-5 shadow-lg ring-4 ring-primary/10">
              <Fingerprint className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground relative after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-1 after:h-1 after:w-28 after:bg-gradient-to-r after:from-primary after:to-accent after:rounded-full">RC Manager</h1>
            <p className="text-sm text-muted-foreground mt-2 font-medium">Secure Certificate Management</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-semibold text-sm">Username</Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  const error = validateField("email", e.target.value);
                  setErrors(prev => ({ ...prev, email: error || undefined }));
                }}
                placeholder="Enter your username"
                className={`h-11 rounded-lg ${errors.email ? 'border-destructive ring-1 ring-destructive/40' : 'focus-visible:ring-2 focus-visible:ring-primary/40'} transition`}
              />
              {errors.email && (
                <p className="text-xs text-destructive font-medium">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-semibold text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    const error = validateField("password", e.target.value);
                    setErrors(prev => ({ ...prev, password: error || undefined }));
                  }}
                  placeholder="••••••••"
                  className={`h-11 rounded-lg pr-10 ${errors.password ? 'border-destructive ring-1 ring-destructive/40' : 'focus-visible:ring-2 focus-visible:ring-primary/40'} transition`}
                />
                <button
                  type="button"
                  onClick={handlePasswordVisibilityToggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive font-medium">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-semibold text-sm">Sign in as</Label>
              <div className="flex gap-2 bg-secondary/80 p-1.5 rounded-lg border border-border/70">
                {['admin','teacher','student'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r as any)}
                    className={`flex-1 py-2.5 px-3 rounded-md text-sm font-semibold transition ${
                      role === r
                        ? 'bg-gradient-to-r from-primary to-accent text-white shadow-sm'
                        : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full mt-6 h-11 text-sm font-bold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-md" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
