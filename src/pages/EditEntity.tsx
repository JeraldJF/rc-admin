import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CalendarIcon, Save, Loader2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getTeacherById, getStudentById, updateTeacher, updateStudent, attestFieldClaim } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

const FormField = ({ children }: { children: React.ReactNode}) => (
  <div className="space-y-2.5">{children}</div>
);

const EditEntity = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>("admin");
  const [originalAttestableData, setOriginalAttestableData] = useState<{
    degree?: string;
    grade?: string;
    instituteName?: string;
  }>({});
  const [formData, setFormData] = useState({
    gender: "Male",
    fullName: "",
    name: "",
    mobile: "",
    email: "",
    instituteName: "",
    dob: "",
    subject: "", // For teachers
    degree: "", // For students
    grade: "", // For students
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "admin";
    setUserRole(role);
    
    const fetchEntityData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        if (role === "admin") {
          // Fetch teacher data
          const teacherData = await getTeacherById(id);
          setFormData({
            gender: teacherData.gender || "Male",
            fullName: "",
            name: teacherData.name || "",
            mobile: teacherData.mobile || "",
            email: teacherData.email || "",
            instituteName: teacherData.instituteName || "",
            dob: teacherData.dob || "",
            subject: teacherData.subject || "",
          });
        } else {
          // Fetch student data
          const studentData = await getStudentById(id);
          const studentFormData = {
            gender: studentData.gender || "Male",
            fullName: studentData.fullName || "",
            name: "",
            mobile: studentData.mobile || "",
            email: studentData.email || "",
            instituteName: studentData.instituteName || "",
            dob: studentData.dob || "",
            subject: "",
            degree: studentData.degree || "",
            grade: studentData.grade || "",
          };
          setFormData(studentFormData);
          // Store original attestable data
          setOriginalAttestableData({
            degree: studentData.degree || "",
            grade: studentData.grade || "",
            instituteName: studentData.instituteName || "",
          });
        }
      } catch (error) {
        toast({
          title: t("toast.failed_load_data"),
          description: error instanceof Error ? error.message : t("toast.could_not_fetch_data"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchEntityData();
  }, [id]);

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
    
    if (!formData.dob) newErrors.dob = "Date of Birth is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.mobile) newErrors.mobile = "Mobile number is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.instituteName) newErrors.instituteName = "Institute Name is required";

    if (userRole === "admin") {
      // Editing teacher
      if (!formData.name) newErrors.name = "Name is required";
    } else {
      // Editing student
      if (!formData.fullName) newErrors.fullName = "Full Name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm() && id) {
      setIsSaving(true);
      try {
        if (userRole === "admin") {
          // Update Teacher
          await updateTeacher(id, {
            name: formData.name,
            mobile: formData.mobile,
            email: formData.email,
            subject: formData.subject,
            instituteName: formData.instituteName,
            gender: formData.gender,
          });
          toast({
            title: t("toast.teacher_updated"),
            description: t("toast.teacher_record_updated"),
            variant: "success",
          });
        } else {
          // Update Student
          await updateStudent(id, {
            fullName: formData.fullName,
            dob: formData.dob,
            gender: formData.gender,
            mobile: formData.mobile,
            email: formData.email,
            instituteName: formData.instituteName,
            degree: formData.degree,
            grade: formData.grade,
          });

          // Check if attestable fields changed
          const changedFields: string[] = [];
          if (formData.degree !== originalAttestableData.degree) changedFields.push("degree");
          if (formData.grade !== originalAttestableData.grade) changedFields.push("grade");
          if (formData.instituteName !== originalAttestableData.instituteName) changedFields.push("instituteName");

          if (changedFields.length > 0) {
            // Request attestation for changed fields
            try {
              await attestFieldClaim(id, changedFields);
              toast({
                title: t("toast.student_updated_with_claim"),
                description: "You have changed attestable data, so a claim is raised. You can download the certificate after verification.",
                variant: "default",
              });
            } catch (error) {
              toast({
                title: t("toast.student_updated"),
                description: t("toast.student_record_updated") + " (Attestation request failed)",
                variant: "success",
              });
            }
          } else {
            toast({
              title: t("toast.student_updated"),
              description: t("toast.student_record_updated"),
              variant: "success",
            });
          }
        }
        navigate("/registry");
      } catch (error) {
        toast({
          title: t("toast.failed_update"),
          description: error instanceof Error ? error.message : t("toast.could_not_update"),
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const pageTitle = userRole === "admin" ? t("heading.edit_teacher") : t("heading.edit_student");
  const isTeacher = userRole === "admin";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2 hover:bg-accent transition-colors rounded-lg">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold">{t("btn.back")}</span>
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
                  <Label htmlFor="instituteName" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {t("form.institute_name")} <span className="text-destructive">*</span>
                    {!isTeacher && <Badge variant="secondary" className="text-xs gap-1"><Shield className="h-3 w-3" />Attestable</Badge>}
                  </Label>
                  {!isTeacher ? (
                    <Select
                      value={formData.instituteName}
                      onValueChange={(value) => {
                        setFormData({ ...formData, instituteName: value });
                        const error = validateField("instituteName", value);
                        setErrors(prev => ({ ...prev, instituteName: error || undefined }));
                      }}
                      disabled={true}
                    >
                      <SelectTrigger className="rounded-lg h-11 bg-muted/50 cursor-not-allowed">
                        <SelectValue placeholder={t("form.select_institute")} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="IIT Delhi">IIT Delhi</SelectItem>
                        <SelectItem value="IIT Bombay">IIT Bombay</SelectItem>
                        <SelectItem value="NIT Trichy">NIT Trichy</SelectItem>
                        <SelectItem value="Delhi University">Delhi University</SelectItem>
                        <SelectItem value="Anna University">Anna University</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
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
                  )}
                  {errors.instituteName && <p className="text-sm font-medium text-destructive">{errors.instituteName}</p>}
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField>
                  <Label htmlFor="mobile" className="text-sm font-semibold text-foreground">
                    {t("form.mobile_number")} <span className="text-destructive">*</span>
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

              {/* Degree and Grade fields - only for students */}
              {!isTeacher && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField>
                    <Label htmlFor="degree" className="text-sm font-semibold text-foreground flex items-center gap-2">
                      {t("form.degree")}
                      <Badge variant="secondary" className="text-xs gap-1"><Shield className="h-3 w-3" />Attestable</Badge>
                    </Label>
                    <Select
                      value={formData.degree}
                      onValueChange={(value) => {
                        setFormData({ ...formData, degree: value });
                      }}
                    >
                      <SelectTrigger className="rounded-lg h-11">
                        <SelectValue placeholder={t("form.select_degree")} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="B.Tech">B.Tech</SelectItem>
                        <SelectItem value="M.Tech">M.Tech</SelectItem>
                        <SelectItem value="B.Sc">B.Sc</SelectItem>
                        <SelectItem value="M.Sc">M.Sc</SelectItem>
                        <SelectItem value="MBA">MBA</SelectItem>
                        <SelectItem value="PhD">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField>
                    <Label htmlFor="grade" className="text-sm font-semibold text-foreground flex items-center gap-2">
                      {t("form.grade")}
                      <Badge variant="secondary" className="text-xs gap-1"><Shield className="h-3 w-3" />Attestable</Badge>
                    </Label>
                    <Input
                      id="grade"
                      value={formData.grade}
                      onChange={(e) => {
                        setFormData({ ...formData, grade: e.target.value });
                      }}
                      className="rounded-lg h-11"
                      placeholder={t("form.enter_grade")}
                    />
                  </FormField>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleCancel} className="rounded-lg px-6" disabled={isSaving}>
              {t("btn.cancel")}
            </Button>
            <Button type="submit" className="rounded-lg px-8 bg-primary hover:bg-primary/90 gap-2" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("action.saving")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {t("btn.save_changes")}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditEntity;
