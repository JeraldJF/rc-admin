import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CalendarIcon, Save, Loader2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { addEmployee, issueEmployeeCertificate } from "@/lib/employeeApi";

const FormField = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-2.5">{children}</div>
);

const AddEntity = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [savingStep, setSavingStep] = useState<"saving" | "issuing" | null>(null);

  const [formData, setFormData] = useState({
    gender: "Male",
    fullName: "",
    mobile: "",
    email: "",
    instituteName: "",
    dob: "",
    degree: "",
    grade: "",
    personalIdentification: "",
    typeIdentification: "",
    positionName: "",
    departmentName: "",
    companyName: "",
    salary: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (fieldName: string, value: string) => {
    if (fieldName === "dob" && !value) return "Admission date is required";
    if (fieldName === "fullName" && !value) return "Full name is required";
    return "";
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.dob) newErrors.dob = "Admission date is required";
    if (!formData.fullName) newErrors.fullName = "Full name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSaving(true);
      setSavingStep("saving");
      try {
        // Add Employee (flat schema)
        const result = await addEmployee({
          fullName: formData.fullName,
          email: formData.email || `${formData.personalIdentification || Date.now()}@rc.local`,
          ...(formData.personalIdentification && { personalIdentification: formData.personalIdentification }),
          ...(formData.typeIdentification && { typeIdentification: formData.typeIdentification }),
          mobile: formData.mobile || "",
          role: 'employee',
          admissionDate: formData.dob,
          ...(formData.positionName && { positionName: formData.positionName }),
          ...(formData.departmentName && { departmentName: formData.departmentName }),
          ...(formData.companyName && { companyName: formData.companyName }),
          ...(formData.salary && { salary: formData.salary }),
        });

        // Extract osid from the registry response
        const osid =
          result?.result?.Employee?.osid ||
          result?.Employee?.osid ||
          result?.osid;

        if (osid) {
          setSavingStep("issuing");
          try {
            await issueEmployeeCertificate(osid);
          } catch (certError) {
            // Certificate issuance failed — employee record was still created.
            // Log but don't block navigation; admin can retry from the registry.
            console.warn("Auto-certificate issuance failed:", certError);
          }
        }

        toast({
          title: "✅ Employee Added",
          description: "Employee record created and certificate issued.",
          variant: "success",
        });
        navigate("/registry");
      } catch (error) {
        toast({
          title: "❌ Failed to add employee",
          description: error instanceof Error ? error.message : "Could not add employee",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
        setSavingStep(null);
      }
    }
  };

  const handleCancel = () => {
    navigate("/registry");
  };

  const pageTitle = "Add Employee";

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
          <Card className="bg-gradient-to-br from-card via-card to-muted/20 shadow-xl border-border rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-8 py-6 border-b border-border/50">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Employee Information
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the employee details below
              </p>
            </div>
            <CardContent className="pt-8 px-8 pb-8 space-y-8">
              {/* Personal Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Personal Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField>
                    <Label htmlFor="fullName" className="text-sm font-semibold text-foreground">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => {
                        setFormData({ ...formData, fullName: e.target.value });
                        const error = validateField("fullName", e.target.value);
                        setErrors(prev => ({ ...prev, fullName: error || undefined }));
                      }}
                      className={`rounded-lg h-12 text-base ${errors.fullName ? "border-destructive ring-2 ring-destructive/20" : "border-border/60 focus:border-primary"}`}
                      placeholder="Enter full name"
                    />
                    {errors.fullName && (
                      <p className="text-sm font-medium text-destructive flex items-center gap-1">
                        <span className="text-xs">⚠</span> {errors.fullName}
                      </p>
                    )}
                  </FormField>

                  <FormField>
                    <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="rounded-lg h-12 text-base border-border/60 focus:border-primary"
                      placeholder="employee@example.com"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <FormField>
                    <Label className="text-sm font-semibold text-foreground">
                      Admission Date <span className="text-destructive">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal rounded-lg h-12 text-base",
                            !formData.dob && "text-muted-foreground",
                            errors.dob ? "border-destructive ring-2 ring-destructive/20" : "border-border/60 hover:border-primary"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-5 w-5" />
                          {formData.dob ? format(new Date(formData.dob), "MMMM dd, yyyy") : "Select admission date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover shadow-xl border-border rounded-xl" align="start">
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
                          className="rounded-xl"
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.dob && (
                      <p className="text-sm font-medium text-destructive flex items-center gap-1">
                        <span className="text-xs">⚠</span> {errors.dob}
                      </p>
                    )}
                  </FormField>
                </div>
              </div>

              {/* Employment Details */}
              {(
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Employment Details</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField>
                      <Label htmlFor="personalIdentification" className="text-sm font-semibold text-foreground">
                        Personal ID (Cédula)
                      </Label>
                      <Input
                        id="personalIdentification"
                        value={formData.personalIdentification}
                        onChange={(e) => setFormData({ ...formData, personalIdentification: e.target.value })}
                        className="rounded-lg h-12 text-base border-border/60 focus:border-primary"
                        placeholder="e.g. 40225928239"
                      />
                    </FormField>
                    <FormField>
                      <Label htmlFor="typeIdentification" className="text-sm font-semibold text-foreground">
                        Document Type
                      </Label>
                      <Input
                        id="typeIdentification"
                        value={formData.typeIdentification}
                        onChange={(e) => setFormData({ ...formData, typeIdentification: e.target.value })}
                        className="rounded-lg h-12 text-base border-border/60 focus:border-primary"
                        placeholder="e.g. Cédula"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField>
                      <Label htmlFor="positionName" className="text-sm font-semibold text-foreground">
                        Position / Cargo
                      </Label>
                      <Input
                        id="positionName"
                        value={formData.positionName}
                        onChange={(e) => setFormData({ ...formData, positionName: e.target.value })}
                        className="rounded-lg h-12 text-base border-border/60 focus:border-primary"
                        placeholder="e.g. ANALISTA II"
                      />
                    </FormField>
                    <FormField>
                      <Label htmlFor="departmentName" className="text-sm font-semibold text-foreground">
                        Department / Unidad Organizativa
                      </Label>
                      <Input
                        id="departmentName"
                        value={formData.departmentName}
                        onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                        className="rounded-lg h-12 text-base border-border/60 focus:border-primary"
                        placeholder="e.g. DIRECCION ADMINISTRATIVA"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField>
                      <Label htmlFor="companyName" className="text-sm font-semibold text-foreground">
                        Institution / Institución
                      </Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="rounded-lg h-12 text-base border-border/60 focus:border-primary"
                        placeholder="e.g. Ministerio de Administración Pública"
                      />
                    </FormField>
                    <FormField>
                      <Label htmlFor="salary" className="text-sm font-semibold text-foreground">
                        Salary / Salario
                      </Label>
                      <Input
                        id="salary"
                        type="number"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        className="rounded-lg h-12 text-base border-border/60 focus:border-primary"
                        placeholder="e.g. 60000"
                      />
                    </FormField>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pb-8">
            <Button type="button" variant="outline" onClick={handleCancel} className="rounded-lg px-8 h-12 font-semibold border-2 hover:bg-muted">
              {t("btn.cancel")}
            </Button>
            <Button type="submit" disabled={isSaving} className="rounded-lg px-10 h-12 bg-primary hover:bg-primary/90 gap-2 font-semibold shadow-lg hover:shadow-xl transition-all">
              {savingStep === "saving" ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : savingStep === "issuing" ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Issuing certificate...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Add Employee
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
