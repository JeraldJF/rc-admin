import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, Save, User, Loader2, Shield, AlertCircle, Download, Edit2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { searchAdminByEmail, getAdminById } from "@/lib/api";
import { searchEmployeeByOsOwner, getEmployeeById, searchAllEmployees, updateEmployee, downloadEmployeeCertificate, checkCertificateIssued } from "@/lib/employeeApi";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const FormField = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-2.5">{children}</div>
);

const ViewProfile = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("admin");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [profileNotFound, setProfileNotFound] = useState(false);
  const [certIssued, setCertIssued] = useState(false);
  const [certChecking, setCertChecking] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    gender: "Male",
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
    statusName: "",
    exitDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const userEmail = sessionStorage.getItem("userEmail");
    const role = sessionStorage.getItem("userRole") || "admin";
    setUserRole(role);

    if (userEmail) {
      const emailUsername = userEmail.split("@")[0];
      setUsername(emailUsername);

      // Fetch profile data based on role
      if (role === "admin") {
        fetchAdminProfile(userEmail);
      } else if (role === "employee") {
        fetchEmployeeProfile(userEmail);
      }
    }
  }, []);

  const fetchAdminProfile = async (email: string) => {
    setIsLoading(true);
    try {
      const searchResults = await searchAdminByEmail(email);

      // Handle search response - could be array or object with data property
      const adminsArray = Array.isArray(searchResults) ? searchResults : (searchResults.data || []);

      if (adminsArray && adminsArray.length > 0) {
        const adminSummary = adminsArray[0];
        const osid = adminSummary.osid;

        const adminDetails = await getAdminById(osid);
      }
    } catch (error) {
      toast({
        title: "❌ Failed to load profile",
        description: error instanceof Error ? error.message : "Could not fetch admin profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployeeProfile = async (email: string) => {
    setIsLoading(true);
    try {
      let osid = "";
      let employeeSummary: any = null;

      // Method 0: Use osid stored during login (fastest, works for all roles)
      const storedOsid = sessionStorage.getItem('employeeOsid');
      if (storedOsid) {
        try {
          const record = await getEmployeeById(storedOsid);
          const data = record?.Employee || record;
          if (data?.osid) {
            employeeSummary = data;
            osid = data.osid;
          }
        } catch (err) {
          // Direct osid fetch failed, trying search
        }
      }

      // Helper: unwrap { Employee: {...} } wrapper and match by email.
      // Requires systemDetails to be present — sub-records (contactDetails, etc.)
      // returned by the Registry API don't have systemDetails and must be skipped.
      const findByEmail = (records: any[], targetEmail: string): any | null => {
        const target = targetEmail.toLowerCase();
        for (const raw of records) {
          const emp = raw?.Employee || raw;
          if (!emp.systemDetails) continue; // skip sub-records
          const empEmail = (emp.contactDetails?.email || emp.email || "").toLowerCase();
          if (empEmail && empEmail === target) return emp;
        }
        return null;
      };

      const extractArray = (data: any): any[] => {
        if (Array.isArray(data)) return data;
        const inner = data?.data || data?.Employee || data?.result?.Employee || data?.content;
        if (Array.isArray(inner)) return inner;
        return [];
      };

      // Method 1: Search all records (no filter) and match client-side by email.
      // Nested-field filters (e.g. contactDetails.email) cause the Registry to return
      // child sub-records instead of the parent Employee entity, so we avoid them.
      // With ABAC: admin tokens return all records; employee tokens return only their own.
      if (!osid) {
        try {
          const allEmployees = await searchAllEmployees();
          const found = findByEmail(extractArray(allEmployees), email);
          if (found) {
            employeeSummary = found;
            osid = found.osid || found.id;
          }
        } catch (err) {
          console.error("❌ Search failed:", err);
        }
      }

      // Method 2: Search by osOwner as fallback (employees have osOwner = their email)
      if (!osid) {
        try {
          const ownerResults = await searchEmployeeByOsOwner(email);
          const found = findByEmail(extractArray(ownerResults), email);
          if (found) {
            employeeSummary = found;
            osid = found.osid || found.id;
          }
        } catch (err) {
          // osOwner search failed
        }
      }

      if (osid) {
        sessionStorage.setItem("employeeOsid", osid);

        // Check if admin has issued a certificate for this employee
        setCertChecking(true);
        checkCertificateIssued(osid).then(({ issued }) => {
          setCertIssued(issued);
          setCertChecking(false);
        }).catch(() => setCertChecking(false));

        // Fetch full details using the efficient ID endpoint
        const response = await getEmployeeById(osid);

        // Robust extraction: Handle if it's nested under Employee, result.Employee, or direct
        let employeeDetails: any = response;

        // Level 1: Check if response is array
        if (Array.isArray(employeeDetails)) {
          employeeDetails = employeeDetails.length > 0 ? employeeDetails[0] : {};
        }

        // Level 2: Check for wrapper keys (common in Sunbird RC)
        if (employeeDetails.Employee) {
          employeeDetails = employeeDetails.Employee;
        } else if (employeeDetails.result?.Employee) {
          employeeDetails = employeeDetails.result.Employee;
        }

        // Level 3: Check if wrapped content is array
        if (Array.isArray(employeeDetails)) {
          employeeDetails = employeeDetails.length > 0 ? employeeDetails[0] : {};
        }

        const admissionRaw = employeeDetails.admissionDate || employeeDetails.employmentDetails?.admissionDate || "";
        let admissionFormatted = "";
        if (admissionRaw) {
          try { admissionFormatted = format(new Date(admissionRaw), "yyyy-MM-dd"); } catch { admissionFormatted = admissionRaw; }
        }
        setFormData({
          fullName: employeeDetails.fullName || employeeDetails.identityDetails?.fullName || employeeDetails.name || "",
          gender: "Male",
          mobile: employeeDetails.mobile || employeeDetails.contactDetails?.mobile || "",
          email: employeeDetails.email || employeeDetails.contactDetails?.email || "",
          instituteName: employeeDetails.personalIdentification || employeeDetails.identityDetails?.personalIdentification || "",
          dob: admissionFormatted,
          degree: "",
          grade: "",
          personalIdentification: employeeDetails.personalIdentification || employeeDetails.identityDetails?.personalIdentification || "",
          typeIdentification: employeeDetails.typeIdentification || employeeDetails.identityDetails?.typeIdentification || "",
          positionName: employeeDetails.positionName || employeeDetails.employmentDetails?.positionName || "",
          departmentName: employeeDetails.departmentName || employeeDetails.employmentDetails?.departmentName || "",
          companyName: employeeDetails.companyName || employeeDetails.employmentDetails?.companyName || "",
          salary: employeeDetails.salary != null ? String(employeeDetails.salary) : (employeeDetails.employmentDetails?.salary != null ? String(employeeDetails.employmentDetails.salary) : ""),
          statusName: employeeDetails.statusName || employeeDetails.employmentDetails?.statusName || "",
          exitDate: employeeDetails.contractExpiration || employeeDetails.employmentDetails?.contractExpiration || "",
        });
      } else {
        // No RC record for this email — admin needs to create it first
        setProfileNotFound(true);
      }
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
      toast({
        title: "❌ Failed to load profile",
        description: error instanceof Error ? error.message : "Could not fetch employee profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get role display name
  const getRoleDisplay = (role: string) => {
    if (role === "admin") return t("login.admin");
    return t("login.admin");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (userRole === "employee") {
      if (!formData.fullName) newErrors.fullName = "Full Name is required";
      if (!formData.mobile) newErrors.mobile = "Mobile number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSaving(true);

      try {
        if (userRole === "employee") {
          const empOsid = sessionStorage.getItem("employeeOsid") || "";
          if (empOsid) {
            await updateEmployee(empOsid, {
              fullName: formData.fullName,
              mobile: formData.mobile,
              ...(formData.dob && { admissionDate: formData.dob }),
            });
          }
          toast({
            title: "✅ Profile updated successfully",
            description: "Your profile has been saved.",
            variant: "success",
          });
          setIsEditMode(false);
          const userEmail = sessionStorage.getItem("userEmail") || "";
          if (userEmail) fetchEmployeeProfile(userEmail);
        } else {
          // For admin, just show success message
          toast({
            title: "✅ Profile updated successfully",
            description: "Your profile has been saved.",
            variant: "success",
          });
        }

        // No navigation - stay on profile page
      } catch (error) {
        toast({
          title: "❌ Failed to update profile",
          description: error instanceof Error ? error.message : "Could not save profile",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    // Reload profile data to reset form
    const userEmail = sessionStorage.getItem("userEmail");
    const role = sessionStorage.getItem("userRole") || "admin";
    if (userEmail) {
      if (role === "employee") {
        fetchEmployeeProfile(userEmail);
        setIsEditMode(false);
      } else {
        fetchAdminProfile(userEmail);
      }
    }
  };

  const handleDownloadEmployeeCertificate = async () => {
    const osid = sessionStorage.getItem("employeeOsid") || "";
    if (!osid) {
      toast({ title: "❌ Error", description: "Employee record not found", variant: "destructive" });
      return;
    }
    setDownloadingId(osid);
    try {
      const blob = await downloadEmployeeCertificate(osid);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = (formData.fullName || "employee").replace(/\s+/g, "_");
      link.download = `${safeName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: "✅ Certificate downloaded", description: "Your certificate has been downloaded successfully.", variant: "success" });
    } catch (error) {
      toast({ title: "❌ Download failed", description: error instanceof Error ? error.message : "Could not download certificate", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const isAdmin = userRole === "admin";
  const isReadOnly = isAdmin;
  const isEmployee = userRole === "employee";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {isLoading ? (
          <Card className="bg-card shadow-xl border-2 border-border rounded-2xl overflow-hidden">
            <CardContent className="pt-8 px-8 pb-8">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">{t("action.loading")}</span>
              </div>
            </CardContent>
          </Card>
        ) : profileNotFound ? (
          <Card className="bg-card shadow-xl border-2 border-border rounded-2xl overflow-hidden">
            <CardContent className="pt-8 px-8 pb-8">
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <AlertCircle className="h-12 w-12 text-amber-500" />
                <h2 className="text-xl font-bold text-foreground">Profile Not Found</h2>
                <p className="text-muted-foreground max-w-sm">
                  No registry record was found for <span className="font-semibold text-foreground">{sessionStorage.getItem("userEmail")}</span>.
                  Please contact your administrator to set up your account.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Employee View Mode */}
            {userRole === "employee" && !isEditMode ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-card shadow-2xl border-2 border-border/60 rounded-3xl overflow-hidden backdrop-blur-sm">
                  <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
                    <div className="absolute -bottom-12 left-8 p-1 bg-background rounded-2xl shadow-xl">
                      <div className="h-24 w-24 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-12 w-12" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="pt-16 px-8 pb-8">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h2 className="text-3xl font-black tracking-tight text-foreground">{formData.fullName || "—"}</h2>
                        {formData.positionName && (
                          <Badge variant="outline" className="mt-2 text-primary border-primary/20 bg-primary/5 px-3 py-1 text-sm font-bold uppercase tracking-widest leading-none">
                            {formData.positionName}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                        <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Personal ID</Label>
                        <p className="text-lg font-bold text-foreground">{formData.personalIdentification || "—"}</p>
                      </div>
                      <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                        <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Document Type</Label>
                        <p className="text-lg font-bold text-foreground">{formData.typeIdentification || "—"}</p>
                      </div>
                      <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                        <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Position</Label>
                        <p className="text-lg font-bold text-foreground">{formData.positionName || "—"}</p>
                      </div>
                      <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                        <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Department</Label>
                        <p className="text-lg font-bold text-foreground">{formData.departmentName || "—"}</p>
                      </div>
                      <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                        <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Institution</Label>
                        <p className="text-lg font-bold text-foreground">{formData.companyName || "—"}</p>
                      </div>
                      <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                        <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Status</Label>
                        <p className={`text-lg font-bold ${formData.statusName === "Activo" || formData.statusName === "Active" ? "text-green-600" : formData.statusName === "Desvinculado" || formData.statusName === "Inactive" ? "text-red-500" : "text-foreground"}`}>
                          {formData.statusName || "—"}
                        </p>
                      </div>
                      <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                        <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Date of Joining</Label>
                        <p className="text-lg font-bold text-foreground">
                          {formData.dob ? (() => { try { return format(new Date(formData.dob), "dd/MM/yyyy"); } catch { return formData.dob; } })() : "—"}
                        </p>
                      </div>
                      {formData.exitDate && (
                        <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                          <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Exit Date</Label>
                          <p className="text-lg font-bold text-foreground">
                            {(() => { try { return format(new Date(formData.exitDate), "dd/MM/yyyy"); } catch { return formData.exitDate; } })()}
                          </p>
                        </div>
                      )}
                      {formData.salary && (
                        <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                          <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Salary</Label>
                          <p className="text-lg font-bold text-foreground">RD$ {Number(formData.salary).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Edit Mode Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="bg-card shadow-xl border-2 border-border rounded-2xl overflow-hidden">
                  <CardContent className="pt-8 px-8 pb-8 space-y-6">
                  {isEmployee ? (
                    <>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField>
                          <Label htmlFor="empFullName" className="text-sm font-semibold text-foreground">
                            Full Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="empFullName"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className={`rounded-lg h-11 font-medium ${errors.fullName ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                            placeholder="Enter full name"
                          />
                          {errors.fullName && <p className="text-sm font-medium text-destructive">{errors.fullName}</p>}
                        </FormField>
                        <FormField>
                          <Label htmlFor="empEmail" className="text-sm font-semibold text-foreground">
                            Email Address
                          </Label>
                          <Input
                            id="empEmail"
                            type="email"
                            value={formData.email}
                            className="rounded-lg h-11 font-medium bg-muted/50 text-foreground cursor-not-allowed"
                            disabled
                          />
                        </FormField>
                        <FormField>
                          <Label htmlFor="empMobile" className="text-sm font-semibold text-foreground">
                            Contact Number <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="empMobile"
                            type="tel"
                            value={formData.mobile}
                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                            className={`rounded-lg h-11 font-medium ${errors.mobile ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                            placeholder="Enter contact number"
                          />
                          {errors.mobile && <p className="text-sm font-medium text-destructive">{errors.mobile}</p>}
                        </FormField>
                        <FormField>
                          <Label className="text-sm font-semibold text-foreground">Date of Joining</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn("w-full justify-start text-left font-medium rounded-lg h-11", !formData.dob && "text-muted-foreground")}
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
                        </FormField>
                      </div>
                      {(formData.personalIdentification || formData.positionName || formData.departmentName || formData.companyName) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          {formData.personalIdentification && (
                            <FormField>
                              <Label className="text-sm font-semibold text-foreground">Personal ID</Label>
                              <Input value={formData.personalIdentification} disabled className="rounded-lg h-11 font-medium bg-muted/50 cursor-not-allowed" />
                            </FormField>
                          )}
                          {formData.typeIdentification && (
                            <FormField>
                              <Label className="text-sm font-semibold text-foreground">Document Type</Label>
                              <Input value={formData.typeIdentification} disabled className="rounded-lg h-11 font-medium bg-muted/50 cursor-not-allowed" />
                            </FormField>
                          )}
                          {formData.positionName && (
                            <FormField>
                              <Label className="text-sm font-semibold text-foreground">Position</Label>
                              <Input value={formData.positionName} disabled className="rounded-lg h-11 font-medium bg-muted/50 cursor-not-allowed" />
                            </FormField>
                          )}
                          {formData.departmentName && (
                            <FormField>
                              <Label className="text-sm font-semibold text-foreground">Department</Label>
                              <Input value={formData.departmentName} disabled className="rounded-lg h-11 font-medium bg-muted/50 cursor-not-allowed" />
                            </FormField>
                          )}
                          {formData.companyName && (
                            <FormField>
                              <Label className="text-sm font-semibold text-foreground">Institution</Label>
                              <Input value={formData.companyName} disabled className="rounded-lg h-11 font-medium bg-muted/50 cursor-not-allowed" />
                            </FormField>
                          )}
                          {formData.salary && (
                            <FormField>
                              <Label className="text-sm font-semibold text-foreground">Salary</Label>
                              <Input value={Number(formData.salary).toLocaleString()} disabled className="rounded-lg h-11 font-medium bg-muted/50 cursor-not-allowed" />
                            </FormField>
                          )}
                        </div>
                      )}
                      <div className="flex justify-end gap-4 pt-4 border-t border-border mt-6">
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
                    </>
                  ) : (
                    <>
                      {/* Admin profile - read-only */}
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Admin profile information</p>
                      </div>
                    </>
                  )}
                  </CardContent>
                </Card>
              </form>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewProfile;
