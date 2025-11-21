import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Fingerprint, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "teacher" | "student">("admin");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateField = (fieldName: "email" | "password", value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (fieldName === "email") {
      if (!value) {
        return "Email is required";
      } else if (!emailRegex.test(value)) {
        return "Please enter a valid email";
      }
    }
    
    if (fieldName === "password") {
      if (!value) {
        return "Password is required";
      } else if (value.length < 8) {
        return "Password must be at least 8 characters";
      } else if (!/[A-Z]/.test(value)) {
        return "Password must contain at least one uppercase letter";
      } else if (!/[0-9]/.test(value)) {
        return "Password must contain at least one number";
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userRole", role);
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
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Fingerprint className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">RC Management</h1>
            <p className="text-muted-foreground mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  const error = validateField("email", e.target.value);
                  setErrors(prev => ({ ...prev, email: error || undefined }));
                }}
                placeholder="admin@example.com"
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  const error = validateField("password", e.target.value);
                  setErrors(prev => ({ ...prev, password: error || undefined }));
                }}
                placeholder="••••••••"
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Sign in as</Label>
              <div className="flex gap-0 bg-muted p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all ${
                    role === "admin"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all ${
                    role === "teacher"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Teacher
                </button>
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all ${
                    role === "student"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Student
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full mt-6 h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
