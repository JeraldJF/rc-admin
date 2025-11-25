import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CalendarIcon, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { addStudent, addTeacher } from "@/lib/api";

const FormField = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-2.5">{children}</div>
);

const AddEntity = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string>("admin");
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    gender: "Male",
    fullName: "",
    name: "",
    mobile: "",
    email: "",
    instituteName: "",
    dob: "",
    subject: "", // For teachers
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "admin";
    setUserRole(role);
  }, []);

  const validateField = (fieldName: string, value: string) => {
    if (fieldName === "dob" && !value) return "Date of Birth is required";
    if (fieldName === "gender" && !value) return "Gender is required";
    if (fieldName === "mobile" && !value) return "Mobile number is required";
    if (fieldName === "email" && !value) return "Email is required";
    if (fieldName === "instituteName" && !value) return "Institute Name is required";
    if (fieldName === "name" && !value && userRole === "admin") return "Name is required";
    if (fieldName === "fullName" && !value && userRole === "teacher") return "Full Name is required";
    return "";
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.dob) newErrors.dob = "Date of Birth is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.mobile) newErrors.mobile = "Mobile number is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.instituteName) newErrors.instituteName = "Institute Name is required";

    if (userRole === "admin") {
      // Adding teacher
      if (!formData.name) newErrors.name = "Name is required";
    } else {
      // Adding student
      if (!formData.fullName) newErrors.fullName = "Full Name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSaving(true);
      try {
        if (userRole === "admin") {
          // Add Teacher
          await addTeacher({
            name: formData.name,
            mobile: formData.mobile,
            email: formData.email,
            subject: formData.subject || "",
            instituteName: formData.instituteName,
            gender: formData.gender,
          });
          toast({
            title: "✅ Teacher added successfully",
            description: "The teacher record has been created.",
            variant: "success",
          });
        } else {
          // Add Student
          await addStudent({
            fullName: formData.fullName,
            dob: formData.dob,
            gender: formData.gender,
            mobile: formData.mobile,
            email: formData.email,
            instituteName: formData.instituteName,
          });
          toast({
            title: "✅ Student added successfully",
            description: "The student record has been created.",
            variant: "success",
          });
        }
        navigate("/registry");
      } catch (error) {
        toast({
          title: "❌ Failed to add record",
          description: error instanceof Error ? error.message : "Could not create the record",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    navigate("/registry");
  };

  const pageTitle = userRole === "admin" ? "Add Teacher Details" : "Add Student Details";
  const isTeacher = userRole === "admin";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2 hover:bg-accent transition-colors rounded-lg">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold">Back</span>
          </Button>
          <div className="h-6 w-px bg-border"></div>
          <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-card shadow-lg border-border rounded-xl overflow-hidden">
            <CardContent className="pt-8 px-8 pb-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField>
                  <Label htmlFor={isTeacher ? "name" : "fullName"} className="text-sm font-semibold text-foreground">
                    {isTeacher ? "Name" : "Full Name"} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={isTeacher ? "name" : "fullName"}
                    value={isTeacher ? formData.name : formData.fullName}
                    onChange={(e) => {
                      const fieldName = isTeacher ? "name" : "fullName";
                      setFormData({ ...formData, [fieldName]: e.target.value });
                      const error = validateField(fieldName, e.target.value);
                      setErrors(prev => ({ ...prev, [fieldName]: error || undefined }));
                    }}
                    className={`rounded-lg h-11 ${(isTeacher ? errors.name : errors.fullName) ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                    placeholder={isTeacher ? "Enter name" : "Enter full name"}
                  />
                  {(isTeacher ? errors.name : errors.fullName) && (
                    <p className="text-sm font-medium text-destructive">{isTeacher ? errors.name : errors.fullName}</p>
                  )}
                </FormField>
                <FormField>
                  <Label htmlFor="gender" className="text-sm font-semibold text-foreground">
                    Gender <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => {
                      setFormData({ ...formData, gender: value });
                      const error = validateField("gender", value);
                      setErrors(prev => ({ ...prev, gender: error || undefined }));
                    }}
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
                        onSelect={(date) => {
                          const value = date ? format(date, "yyyy-MM-dd") : "";
                          setFormData({ ...formData, dob: value });
                          const error = validateField("dob", value);
                          setErrors(prev => ({ ...prev, dob: error || undefined }));
                        }}
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
                  <Input
                    id="instituteName"
                    value={formData.instituteName}
                    onChange={(e) => {
                      setFormData({ ...formData, instituteName: e.target.value });
                      const error = validateField("instituteName", e.target.value);
                      setErrors(prev => ({ ...prev, instituteName: error || undefined }));
                    }}
                    className={`rounded-lg h-11 ${errors.instituteName ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                    placeholder="Enter institute name"
                  />
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
                    onChange={(e) => {
                      setFormData({ ...formData, mobile: e.target.value });
                      const error = validateField("mobile", e.target.value);
                      setErrors(prev => ({ ...prev, mobile: error || undefined }));
                    }}
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
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      const error = validateField("email", e.target.value);
                      setErrors(prev => ({ ...prev, email: error || undefined }));
                    }}
                    className={`rounded-lg h-11 ${errors.email ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                    placeholder="email@example.com"
                  />
                  {errors.email && <p className="text-sm font-medium text-destructive">{errors.email}</p>}
                </FormField>
              </div>

              {/* Subject field - only for teachers (admin adding teacher) */}
              {isTeacher && (
                <FormField>
                  <Label htmlFor="subject" className="text-sm font-semibold text-foreground">
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => {
                      setFormData({ ...formData, subject: e.target.value });
                    }}
                    className="rounded-lg h-11"
                    placeholder="Enter subject"
                  />
                </FormField>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleCancel} className="rounded-lg px-6">
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="rounded-lg px-8 bg-primary hover:bg-primary/90 gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save {isTeacher ? "Teacher" : "Student"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AddEntity;
