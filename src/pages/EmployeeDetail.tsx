import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Loader2, AlertCircle, Download, CheckCircle2, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { parseLocalDate } from "@/lib/utils";
import {
  findEmployeeByOsid,
  checkCertificateIssued,
  issueEmployeeCertificate,
  fetchCertificatePdf,
} from "@/lib/employeeApi";

const fmtDate = (raw?: string) => {
  if (!raw) return "—";
  const d = parseLocalDate(raw);
  return d ? format(d, "dd/MM/yyyy") : raw;
};

const EmployeeDetail = () => {
  const { osid } = useParams<{ osid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [employee, setEmployee] = useState<any>(null);

  const [certChecking, setCertChecking] = useState(false);
  const [certIssued, setCertIssued] = useState(false);
  const [certId, setCertId] = useState<string | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!osid) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        // Prefer the record passed via navigation state from the employee list —
        // the registry 401s GET /Employee/{osid} for admins (owner-level ABAC), so
        // we reuse the search result already fetched by the list. On refresh /
        // direct-link (no state) fall back to finding the record via search.
        const fromState = (location.state as any)?.employee;
        let emp: any = fromState?.Employee || fromState;
        if (!emp || (!emp.fullName && !emp.email && !emp.personalIdentification)) {
          emp = await findEmployeeByOsid(osid);
        }
        if (!emp || (!emp.fullName && !emp.email && !emp.personalIdentification)) {
          setNotFound(true);
          return;
        }
        setEmployee(emp);

        setCertChecking(true);
        try {
          const { issued, credentialId } = await checkCertificateIssued(osid);
          setCertIssued(issued);
          setCertId(credentialId);
        } finally {
          setCertChecking(false);
        }
      } catch (error) {
        toast({
          title: "❌ Failed to load employee",
          description: error instanceof Error ? error.message : "Could not fetch employee details",
          variant: "destructive",
        });
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [osid]);

  const handleIssue = async () => {
    if (!osid || !employee) return;
    setIsIssuing(true);
    try {
      const credentialId = await issueEmployeeCertificate(osid, employee);
      setCertIssued(true);
      setCertId(credentialId);
      toast({
        title: "✅ Certificate issued",
        description: "The certificate has been issued for this employee.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "❌ Failed to issue certificate",
        description: error instanceof Error ? error.message : "Could not issue certificate",
        variant: "destructive",
      });
    } finally {
      setIsIssuing(false);
    }
  };

  const handleDownload = async () => {
    if (!certId) {
      toast({ title: "❌ Error", description: "Certificate not found.", variant: "destructive" });
      return;
    }
    setIsDownloading(true);
    try {
      const blob = await fetchCertificatePdf(certId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = (employee?.fullName || "employee").replace(/\s+/g, "_");
      link.download = `${safeName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: "✅ Certificate downloaded", description: "The certificate has been downloaded.", variant: "success" });
    } catch (error) {
      toast({
        title: "❌ Download failed",
        description: error instanceof Error ? error.message : "Could not download certificate",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const statusName: string = employee?.statusName || "";
  const isActive = statusName === "Activo" || statusName === "Active";
  const isInactive = statusName === "Desvinculado" || statusName === "Inactive";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/employees")} className="gap-2 hover:bg-accent transition-colors rounded-lg">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold">{t("action.back")}</span>
          </Button>
          <div className="h-6 w-px bg-border"></div>
          <h1 className="text-2xl font-bold text-foreground">Employee Details</h1>
        </div>

        {isLoading ? (
          <Card className="bg-card shadow-xl border-2 border-border rounded-2xl overflow-hidden">
            <CardContent className="pt-8 px-8 pb-8">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">{t("action.loading")}</span>
              </div>
            </CardContent>
          </Card>
        ) : notFound ? (
          <Card className="bg-card shadow-xl border-2 border-border rounded-2xl overflow-hidden">
            <CardContent className="pt-8 px-8 pb-8">
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <AlertCircle className="h-12 w-12 text-amber-500" />
                <h2 className="text-xl font-bold text-foreground">Employee Not Found</h2>
                <p className="text-muted-foreground max-w-sm">
                  No employee record was found for this ID.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
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
                <div className="flex justify-between items-start mb-8 gap-4 flex-wrap">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-foreground">{employee?.fullName || "—"}</h2>
                    {employee?.positionName && (
                      <Badge variant="outline" className="mt-2 text-primary border-primary/20 bg-primary/5 px-3 py-1 text-sm font-bold uppercase tracking-widest leading-none">
                        {employee.positionName}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    {certChecking ? (
                      <Button type="button" variant="outline" className="gap-2 rounded-xl h-11 px-5" disabled>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading certificate...
                      </Button>
                    ) : certIssued ? (
                      <>
                        <Badge variant="outline" className="gap-2 border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Certificate already issued
                        </Badge>
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2 rounded-xl h-11 px-5"
                          onClick={handleDownload}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
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
                        className="gap-2 rounded-xl h-11 px-5 bg-primary hover:bg-primary/90 font-semibold shadow-lg"
                        onClick={handleIssue}
                        disabled={isIssuing}
                      >
                        {isIssuing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Issuing certificate...
                          </>
                        ) : (
                          <>
                            <Award className="h-4 w-4" />
                            Issue certificate
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                    <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Personal ID</Label>
                    <p className="text-lg font-bold text-foreground">{employee?.personalIdentification || "—"}</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                    <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Document Type</Label>
                    <p className="text-lg font-bold text-foreground">{employee?.typeIdentification || "—"}</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                    <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Email</Label>
                    <p className="text-lg font-bold text-foreground break-all">{employee?.email || "—"}</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                    <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Position</Label>
                    <p className="text-lg font-bold text-foreground">{employee?.positionName || "—"}</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                    <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Department</Label>
                    <p className="text-lg font-bold text-foreground">{employee?.departmentName || "—"}</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                    <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Institution</Label>
                    <p className="text-lg font-bold text-foreground">{employee?.companyName || "—"}</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                    <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Status</Label>
                    <p className={`text-lg font-bold ${isActive ? "text-green-600" : isInactive ? "text-red-500" : "text-foreground"}`}>
                      {statusName || "—"}
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                    <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Admission Date</Label>
                    <p className="text-lg font-bold text-foreground">{fmtDate(employee?.admissionDate)}</p>
                  </div>
                  {employee?.contractExpiration && (
                    <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                      <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Exit Date</Label>
                      <p className="text-lg font-bold text-foreground">{fmtDate(employee.contractExpiration)}</p>
                    </div>
                  )}
                  {employee?.salary != null && employee?.salary !== "" && (
                    <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
                      <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Salary</Label>
                      <p className="text-lg font-bold text-foreground">RD$ {Number(employee.salary).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDetail;
