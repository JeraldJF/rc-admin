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
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { t } = useLanguage();
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
    if (fieldName === "dob" && !value) return t("validation.dob_required");
    if (fieldName === "gender" && !value) return t("validation.gender_required");
    if (fieldName === "mobile" && !value) return t("validation.mobile_required");
    if (fieldName === "email" && !value) return t("validation.email_required");
    if (fieldName === "instituteName" && !value) return t("validation.institute_required");
    if (fieldName === "name" && !value && userRole === "admin") return t("validation.name_required");
    if (fieldName === "fullName" && !value && userRole === "teacher") return t("validation.full_name_required");
    return "";
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.dob) newErrors.dob = t("validation.dob_required");
    if (!formData.gender) newErrors.gender = t("validation.gender_required");
    if (!formData.mobile) newErrors.mobile = t("validation.mobile_required");
    if (!formData.email) newErrors.email = t("validation.email_required");
    if (!formData.instituteName) newErrors.instituteName = t("validation.institute_required");

    if (userRole === "admin") {
      // Adding teacher
      if (!formData.name) newErrors.name = t("validation.name_required");
    } else {
      // Adding student
      if (!formData.fullName) newErrors.fullName = t("validation.full_name_required");
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
            title: "✅ " + t("toast.teacher_added"),
            description: t("toast.teacher_added_desc"),
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
            title: "✅ " + t("toast.student_added"),
            description: t("toast.student_added_desc"),
            variant: "success",
          });
        }
        navigate("/registry");
      } catch (error) {
        toast({
          title: "❌ " + t("toast.failed_add"),
          description: error instanceof Error ? error.message : t("toast.failed_add_desc"),
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

  const pageTitle = userRole === "admin" ? t("heading.add_teacher") : t("heading.add_student");
  const isTeacher = userRole === "admin";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2 hover:bg-accent transition-colors rounded-lg">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold">{t("action.back")}</span>
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
                    {isTeacher ? t("form.name") : t("form.full_name")} <span className="text-destructive">*</span>
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
                    placeholder={isTeacher ? t("form.enter_name") : t("form.enter_full_name")}
                  />
                  {(isTeacher ? errors.name : errors.fullName) && (
                    <p className="text-sm font-medium text-destructive">{isTeacher ? errors.name : errors.fullName}</p>
                  )}
                </FormField>
                <FormField>
                  <Label htmlFor="gender" className="text-sm font-semibold text-foreground">
                    {t("form.gender")} <span className="text-destructive">*</span>
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
                      <SelectItem value="Male">{t("form.male")}</SelectItem>
                      <SelectItem value="Female">{t("form.female")}</SelectItem>
                      <SelectItem value="Other">{t("form.other")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-sm font-medium text-destructive">{errors.gender}</p>}
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField>
                  <Label className="text-sm font-semibold text-foreground">
                    {t("form.date_of_birth")} <span className="text-destructive">*</span>
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
                        {formData.dob ? format(new Date(formData.dob), "PPP") : t("form.pick_date")}
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
                    {t("form.institute_name")} <span className="text-destructive">*</span>
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
                    placeholder={t("form.enter_institute")}
                  />
                  {errors.instituteName && <p className="text-sm font-medium text-destructive">{errors.instituteName}</p>}
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField>
                  <Label htmlFor="mobile" className="text-sm font-semibold text-foreground">
                    {t("form.mobile")} <span className="text-destructive">*</span>
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
                    placeholder={t("form.enter_mobile")}
                  />
                  {errors.mobile && <p className="text-sm font-medium text-destructive">{errors.mobile}</p>}
                </FormField>
                <FormField>
                  <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                    {t("form.email")} <span className="text-destructive">*</span>
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
                    placeholder={t("form.enter_email")}
                  />
                  {errors.email && <p className="text-sm font-medium text-destructive">{errors.email}</p>}
                </FormField>
              </div>

              {/* Subject field - only for teachers (admin adding teacher) */}
              {isTeacher && (
                <FormField>
                  <Label htmlFor="subject" className="text-sm font-semibold text-foreground">
                    {t("form.subject")}
                  </Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => {
                      setFormData({ ...formData, subject: e.target.value });
                    }}
                    className="rounded-lg h-11"
                    placeholder={t("form.select_subject")}
                  />
                </FormField>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleCancel} className="rounded-lg px-6">
              {t("btn.cancel")}
            </Button>
            <Button type="submit" disabled={isSaving} className="rounded-lg px-8 bg-primary hover:bg-primary/90 gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("action.saving")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {t("btn.save")} {isTeacher ? t("login.teacher") : t("login.student")}
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
