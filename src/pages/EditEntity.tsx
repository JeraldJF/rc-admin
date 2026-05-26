import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CalendarIcon, Save, Loader2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getEmployeeById, updateEmployee } from "@/lib/employeeApi";

const FormField = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-2.5">{children}</div>
);

const EditEntity = () => {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    personalIdentification: "",
    typeIdentification: "",
    positionName: "",
    departmentName: "",
    companyName: "",
    salary: "",
    dob: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await getEmployeeById(id);
        const emp = res?.Employee || res;

        const admissionRaw = emp.admissionDate || "";
        let admissionFormatted = "";
        if (admissionRaw) {
          try { admissionFormatted = format(new Date(admissionRaw), "yyyy-MM-dd"); } catch { admissionFormatted = admissionRaw; }
        }

        setFormData({
          fullName: emp.fullName || "",
          email: emp.email || "",
          personalIdentification: emp.personalIdentification || "",
          typeIdentification: emp.typeIdentification || "",
          positionName: emp.positionName || "",
          departmentName: emp.departmentName || "",
          companyName: emp.companyName || "",
          salary: emp.salary != null ? String(emp.salary) : "",
          dob: admissionFormatted,
        });
      } catch (error) {
        toast({
          title: "❌ Failed to load employee",
          description: error instanceof Error ? error.message : "Could not fetch employee data",
          variant: "destructive",
        });
        navigate("/registry");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = "Full name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !id) return;

    setIsSaving(true);
    try {
      await updateEmployee(id, {
        fullName: formData.fullName,
        ...(formData.email && { email: formData.email }),
        ...(formData.typeIdentification && { typeIdentification: formData.typeIdentification }),
        ...(formData.positionName && { positionName: formData.positionName }),
        ...(formData.departmentName && { departmentName: formData.departmentName }),
        ...(formData.companyName && { companyName: formData.companyName }),
        ...(formData.salary && { salary: formData.salary }),
        ...(formData.dob && { admissionDate: formData.dob }),
      });

      toast({
        title: "✅ Employee Updated",
        description: "Employee record saved successfully.",
        variant: "success",
      });
      navigate("/registry");
    } catch (error) {
      toast({
        title: "❌ Failed to update employee",
        description: error instanceof Error ? error.message : "Could not update employee",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/registry")} className="gap-2 hover:bg-accent transition-colors rounded-lg">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold">{t("action.back")}</span>
          </Button>
          <div className="h-6 w-px bg-border"></div>
          <h1 className="text-2xl font-bold text-foreground">Edit Employee</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-gradient-to-br from-card via-card to-muted/20 shadow-xl border-border rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-8 py-6 border-b border-border/50">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Employee Information
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Update the employee details below</p>
            </div>
            <CardContent className="pt-8 px-8 pb-8 space-y-8">
              {/* Personal Details */}
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
                        if (errors.fullName) setErrors(prev => ({ ...prev, fullName: "" }));
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
                    <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email</Label>
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
                    <Label className="text-sm font-semibold text-foreground">Admission Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal rounded-lg h-12 text-base border-border/60 hover:border-primary",
                            !formData.dob && "text-muted-foreground"
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
                          onSelect={(date) => setFormData({ ...formData, dob: date ? format(date, "yyyy-MM-dd") : "" })}
                          initialFocus
                          className="rounded-xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </FormField>

                </div>
              </div>

              {/* Employment Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Employment Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField>
                    <Label htmlFor="personalIdentification" className="text-sm font-semibold text-foreground">
                      Personal ID (Cédula)
                      <span className="ml-2 text-xs font-normal text-muted-foreground">(cannot be changed)</span>
                    </Label>
                    <Input
                      id="personalIdentification"
                      value={formData.personalIdentification}
                      readOnly
                      className="rounded-lg h-12 text-base bg-muted/50 text-muted-foreground cursor-not-allowed select-none"
                    />
                  </FormField>
                  <FormField>
                    <Label htmlFor="typeIdentification" className="text-sm font-semibold text-foreground">Document Type</Label>
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
                    <Label htmlFor="positionName" className="text-sm font-semibold text-foreground">Position / Cargo</Label>
                    <Input
                      id="positionName"
                      value={formData.positionName}
                      onChange={(e) => setFormData({ ...formData, positionName: e.target.value })}
                      className="rounded-lg h-12 text-base border-border/60 focus:border-primary"
                      placeholder="e.g. ANALISTA II"
                    />
                  </FormField>
                  <FormField>
                    <Label htmlFor="departmentName" className="text-sm font-semibold text-foreground">Department / Unidad Organizativa</Label>
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
                    <Label htmlFor="companyName" className="text-sm font-semibold text-foreground">Institution / Institución</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="rounded-lg h-12 text-base border-border/60 focus:border-primary"
                      placeholder="e.g. Ministerio de Administración Pública"
                    />
                  </FormField>
                  <FormField>
                    <Label htmlFor="salary" className="text-sm font-semibold text-foreground">Salary / Salario</Label>
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
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pb-8">
            <Button type="button" variant="outline" onClick={() => navigate("/registry")} className="rounded-lg px-8 h-12 font-semibold border-2 hover:bg-muted">
              {t("btn.cancel")}
            </Button>
            <Button type="submit" disabled={isSaving} className="rounded-lg px-10 h-12 bg-primary hover:bg-primary/90 gap-2 font-semibold shadow-lg hover:shadow-xl transition-all">
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
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

export default EditEntity;
