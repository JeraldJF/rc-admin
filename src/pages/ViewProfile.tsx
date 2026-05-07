import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { User, Loader2, AlertCircle, Download, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { searchAdminByEmail, getAdminById } from "@/lib/api";
import { searchEmployeeByEmail, searchEmployeeByPersonalId, searchAllEmployees, fetchCertificatePdf, checkCertificateIssued } from "@/lib/employeeApi";
import { Badge } from "@/components/ui/badge";

const ViewProfile = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [profileNotFound, setProfileNotFound] = useState(false);
  const [certIssued, setCertIssued] = useState(false);
  const [certId, setCertId] = useState<string | null>(null);
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

  useEffect(() => {
    const userEmail = sessionStorage.getItem("userEmail");
    const role = sessionStorage.getItem("userRole") || "admin";
    setUserRole(role);

    if (userEmail) {
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

        await getAdminById(osid);
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
      let foundData: any = null;

      const findByPersonalId = (records: any[], pid: string): any | null => {
        for (const raw of records) {
          const emp = raw?.Employee || raw;
          if (!emp.osid && !emp.id) continue;
          if (emp.personalIdentification === pid) return emp;
        }
        return null;
      };

      const findByEmail = (records: any[], targetEmail: string): any | null => {
        const target = targetEmail.toLowerCase();
        for (const raw of records) {
          const emp = raw?.Employee || raw;
          if (!emp.osid && !emp.id) continue;
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

      // Method 1: Search by personalId (cédula) — primary
      const personalId = sessionStorage.getItem('userPersonalId');
      if (!foundData && personalId) {
        try {
          const pidResults = await searchEmployeeByPersonalId(personalId);
          const found = findByPersonalId(extractArray(pidResults), personalId);
          if (found) { osid = found.osid || found.id; foundData = found; }
        } catch { /* personalId search failed */ }
      }

      // Method 2: Search by email (fallback)
      if (!foundData) {
        try {
          const emailResults = await searchEmployeeByEmail(email);
          const found = findByEmail(extractArray(emailResults), email);
          if (found) { osid = found.osid || found.id; foundData = found; }
        } catch { /* email search failed */ }
      }

      // Method 3: Unfiltered scan — last resort (ABAC returns only own record for employee token)
      if (!foundData) {
        try {
          const allEmployees = await searchAllEmployees();
          const records = extractArray(allEmployees);
          const found = (personalId ? findByPersonalId(records, personalId) : null)
                     || findByEmail(records, email);
          if (found) { osid = found.osid || found.id; foundData = found; }
        } catch { /* fallback search failed */ }
      }

      const effectiveOsid = osid || sessionStorage.getItem('employeeOsid') || "";

      if (effectiveOsid) {
        sessionStorage.setItem("employeeOsid", effectiveOsid);

        setCertChecking(true);
        checkCertificateIssued(effectiveOsid).then(({ issued, credentialId }) => {
          setCertIssued(issued);
          setCertId(credentialId);
          setCertChecking(false);
        }).catch(() => setCertChecking(false));

        let employeeDetails: any = foundData || {};

        if (Array.isArray(employeeDetails)) {
          employeeDetails = employeeDetails.length > 0 ? employeeDetails[0] : {};
        }
        if (employeeDetails.Employee) {
          employeeDetails = employeeDetails.Employee;
        } else if (employeeDetails.result?.Employee) {
          employeeDetails = employeeDetails.result.Employee;
        }
        if (Array.isArray(employeeDetails)) {
          employeeDetails = employeeDetails.length > 0 ? employeeDetails[0] : {};
        }

        const admissionRaw = employeeDetails.admissionDate || "";
        let admissionFormatted = "";
        if (admissionRaw) {
          try { admissionFormatted = format(new Date(admissionRaw), "yyyy-MM-dd"); } catch { admissionFormatted = admissionRaw; }
        }

        const exitRaw = employeeDetails.contractExpiration || "";
        let exitFormatted = "";
        if (exitRaw) {
          try { exitFormatted = format(new Date(exitRaw), "yyyy-MM-dd"); } catch { exitFormatted = exitRaw; }
        }

        setFormData({
          fullName: employeeDetails.fullName || "",
          gender: "Male",
          mobile: employeeDetails.mobile || "",
          email: employeeDetails.email || "",
          instituteName: employeeDetails.personalIdentification || "",
          dob: admissionFormatted,
          degree: "",
          grade: "",
          personalIdentification: employeeDetails.personalIdentification || "",
          typeIdentification: employeeDetails.typeIdentification || "",
          positionName: employeeDetails.positionName || "",
          departmentName: employeeDetails.departmentName || "",
          companyName: employeeDetails.companyName || "",
          salary: employeeDetails.salary != null ? String(employeeDetails.salary) : "",
          statusName: employeeDetails.statusName || "",
          exitDate: exitFormatted,
        });
      } else {
        setProfileNotFound(true);
      }
    } catch (error) {
      toast({
        title: "❌ Failed to load profile",
        description: error instanceof Error ? error.message : "Could not fetch employee profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
      if (!certId) throw new Error("Certificate not found. Please refresh and try again.");
      const blob = await fetchCertificatePdf(certId);
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
            {userRole === "employee" ? (
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
                    <div className="flex justify-between items-start mb-8 gap-4">
                      <div>
                        <h2 className="text-3xl font-black tracking-tight text-foreground">{formData.fullName || "—"}</h2>
                        {formData.positionName && (
                          <Badge variant="outline" className="mt-2 text-primary border-primary/20 bg-primary/5 px-3 py-1 text-sm font-bold uppercase tracking-widest leading-none">
                            {formData.positionName}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-3">
                        {certChecking ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2 rounded-xl h-11 px-5"
                            disabled
                          >
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading certificate...
                          </Button>
                        ) : certIssued ? (
                          <>
                            <Badge variant="outline" className="gap-2 border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-700">
                              <CheckCircle2 className="h-4 w-4" />
                              Certificate issued
                            </Badge>
                            <Button
                              type="button"
                              variant="outline"
                              className="gap-2 rounded-xl h-11 px-5"
                              onClick={handleDownloadEmployeeCertificate}
                              disabled={downloadingId !== null}
                            >
                              {downloadingId ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4" />
                                  Download certificate
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2 rounded-xl h-11 px-5"
                            onClick={handleDownloadEmployeeCertificate}
                            disabled={downloadingId !== null}
                          >
                            {downloadingId ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4" />
                                Download certificate
                              </>
                            )}
                          </Button>
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
              /* Admin profile - read-only */
              <Card className="bg-card shadow-xl border-2 border-border rounded-2xl overflow-hidden">
                <CardContent className="pt-8 px-8 pb-8">
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Admin profile information</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewProfile;
