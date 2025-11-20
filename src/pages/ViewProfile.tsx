import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, Save, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { institutes } from "@/data/mockData";

const FormField = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-2.5">{children}</div>
);

const ViewProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("admin");
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  
  const [formData, setFormData] = useState({
    fullName: "admin",
    gender: "Male",
    mobile: "+855 12 345 678",
    email: "admin@example.com",
    instituteName: "Royal University of Phnom Penh",
    dob: "1990-01-15",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    const role = localStorage.getItem("userRole") || "admin";
    setUserRole(role);
    
    if (userEmail) {
      const emailUsername = userEmail.split("@")[0];
      setUsername(emailUsername);
      setFormData(prev => ({ ...prev, fullName: emailUsername }));
    }
  }, []);

  // Get role display name
  const getRoleDisplay = (role: string) => {
    if (role === "admin") return "Administrator";
    if (role === "teacher") return "Teacher";
    if (role === "student") return "Student";
    return "User";
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.dob) newErrors.dob = "Date of Birth is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.fullName) newErrors.fullName = "Full Name is required";
    if (!formData.mobile) newErrors.mobile = "Mobile number is required";
    if (!formData.email) newErrors.email = "Email ID is required";
    if (!formData.instituteName) newErrors.instituteName = "Institute Name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSaving(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      toast({
        title: "✅ Profile updated successfully",
        description: "Your profile has been saved.",
        variant: "success",
      });
      
      // Navigate based on role
      if (userRole === "student") {
        navigate("/claims");
      } else {
        navigate("/registry");
      }
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Navigate based on role
    if (userRole === "student") {
      navigate("/claims");
    } else {
      navigate("/registry");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border-2 border-primary/20">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <User className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{username}</h1>
              <p className="text-sm text-muted-foreground mt-1">{getRoleDisplay(userRole)}</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-card shadow-xl border-2 border-border rounded-2xl overflow-hidden">
            <CardContent className="pt-8 px-8 pb-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField>
                  <Label htmlFor="fullName" className="text-sm font-semibold text-foreground">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`rounded-lg h-11 ${errors.fullName ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                    placeholder="Enter full name"
                  />
                  {errors.fullName && <p className="text-sm font-medium text-destructive">{errors.fullName}</p>}
                </FormField>
                <FormField>
                  <Label htmlFor="gender" className="text-sm font-semibold text-foreground">
                    Gender <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger className={`rounded-lg h-11 ${errors.gender ? "border-destructive ring-2 ring-destructive/20" : ""}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-sm font-medium text-destructive">{errors.gender}</p>}
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField>
                  <Label className="text-sm font-semibold text-foreground">
                    Date of Birth <span className="text-destructive">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal rounded-lg h-11",
                          !formData.dob && "text-muted-foreground",
                          errors.dob ? "border-destructive ring-2 ring-destructive/20" : ""
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dob ? format(new Date(formData.dob), "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dob ? new Date(formData.dob) : undefined}
                        onSelect={(date) => setFormData({ ...formData, dob: date ? format(date, "yyyy-MM-dd") : "" })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.dob && <p className="text-sm font-medium text-destructive">{errors.dob}</p>}
                </FormField>
                <FormField>
                  <Label htmlFor="instituteName" className="text-sm font-semibold text-foreground">
                    Institute Name <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.instituteName}
                    onValueChange={(value) => setFormData({ ...formData, instituteName: value })}
                  >
                    <SelectTrigger className={`rounded-lg h-11 ${errors.instituteName ? "border-destructive ring-2 ring-destructive/20" : ""}`}>
                      <SelectValue placeholder="Select institute" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {institutes.map((institute) => (
                        <SelectItem key={institute} value={institute}>{institute}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.instituteName && <p className="text-sm font-medium text-destructive">{errors.instituteName}</p>}
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField>
                  <Label htmlFor="mobile" className="text-sm font-semibold text-foreground">
                    Mobile number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className={`rounded-lg h-11 ${errors.mobile ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                    placeholder="+855 12 345 678"
                  />
                  {errors.mobile && <p className="text-sm font-medium text-destructive">{errors.mobile}</p>}
                </FormField>
                <FormField>
                  <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                    Email ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`rounded-lg h-11 ${errors.email ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                    placeholder="email@example.com"
                  />
                  {errors.email && <p className="text-sm font-medium text-destructive">{errors.email}</p>}
                </FormField>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleCancel} className="rounded-lg px-6" disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg px-8 bg-primary hover:bg-primary/90 gap-2" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ViewProfile;
