import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpDown, ArrowUp, ArrowDown, Trash2, Loader2, Download, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Claim } from "@/data/claimsData";
import { searchStudentByEmail, getStudentById, downloadStudentCertificate, requestClaim } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

type SortOrder = "asc" | "desc" | null;

const Claims = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isLoadingClaims, setIsLoadingClaims] = useState(false);

  // Helper function to mask claim ID
  const maskClaimId = (id: string) => {
    if (!id || id.length <= 8) return id;
    const lastFour = id.slice(-4);
    return `****-****-${lastFour}`;
  };

  // Fetch claims from API
  const fetchClaims = async () => {
    setIsLoadingClaims(true);
    try {
      const userEmail = localStorage.getItem("userEmail") || "";
      
      // Search student by email to get osid
      const searchResults = await searchStudentByEmail(userEmail);
      
      if (!searchResults || searchResults.length === 0) {
        setClaims([]);
        return;
      }
      
      const osid = searchResults[0].osid;
      
      // Get student details including attestations
      const studentData = await getStudentById(osid);
      
      // Parse studentInstituteAttest array
      const attestations = studentData.studentInstituteAttest || [];
      
      const claimsData: Claim[] = attestations.map((attest: any) => ({
        id: attest.osid || attest._osAttestedId || `claim-${Date.now()}-${Math.random()}`,
        studentName: studentData.fullName || userEmail.split("@")[0],
        instituteName: attest.instituteName || "Unknown Institute",
        teacherName: attest._osAttestedBy || undefined,
        dateRequested: attest.osCreatedAt || new Date().toISOString(),
        dateApproved: attest._osState === "PUBLISHED" ? attest.osUpdatedAt : undefined,
        status: attest._osState === "PUBLISHED" ? "approved" : "pending",
        attestationId: attest.osid,
      }));
      
      setClaims(claimsData);
    } catch (error) {
      console.error("Error fetching claims:", error);
      toast({
        title: t("toast.failed_load_claims"),
        description: error instanceof Error ? error.message : t("toast.could_not_fetch_claims"),
        variant: "destructive",
      });
      setClaims([]);
    } finally {
      setIsLoadingClaims(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  // Sort claims: approved/published first, then by date
  const sortedClaims = [...claims].sort((a, b) => {
    // First, sort by status - approved claims first
    const statusOrder = { approved: 0, pending: 1, rejected: 2 };
    const statusA = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
    const statusB = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
    
    if (statusA !== statusB) {
      return statusA - statusB;
    }
    
    // Then sort by date within same status
    if (!sortOrder) return 0;
    const dateA = new Date(a.dateRequested).getTime();
    const dateB = new Date(b.dateRequested).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  const toggleSort = () => {
    setSortOrder(current => {
      if (current === "desc") return "asc";
      if (current === "asc") return null;
      return "desc";
    });
  };

  const getSortIcon = () => {
    if (sortOrder === "desc") return <ArrowDown className="h-4 w-4" />;
    if (sortOrder === "asc") return <ArrowUp className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4" />;
  };

  const handleRequestClaim = () => {
    // Check if there's already a pending or approved claim for this institute
    const existingClaim = claims.find(
      claim => claim.instituteName === "Royal University of Phnom Penh" && 
      (claim.status === "pending" || claim.status === "approved")
    );
    
    if (existingClaim) {
      toast({
        title: t("toast.cannot_submit_request"),
        description: `${t("toast.existing_claim_message")} ${existingClaim.status} ${t("toast.wait_for_processing")}`,
        variant: "destructive",
      });
      return;
    }
    
    // Show confirmation dialog first
    setShowConfirmDialog(true);
  };

  const handleConfirmRequest = async () => {
    setShowConfirmDialog(false);
    setShowRequestDialog(true);
    setIsLoading(true);
    setShowSuccess(false);
    
    try {
      // Get student osid from localStorage
      const studentOsid = localStorage.getItem("studentOsid") || "";
      
      if (!studentOsid) {
        throw new Error("Student ID not found. Please login again.");
      }
      
      // Call API to request claim
      await requestClaim(studentOsid);
      
      setIsLoading(false);
      setShowSuccess(true);
      
      // Refresh claims list to show the new claim
      await fetchClaims();
      
      // Auto-close dialog after 2-3 seconds
      setTimeout(() => {
        setShowRequestDialog(false);
        setIsLoading(false);
        setShowSuccess(false);
      }, 2500);
    } catch (error) {
      setIsLoading(false);
      setShowRequestDialog(false);
      toast({
        title: t("toast.failed_request_claim"),
        description: error instanceof Error ? error.message : t("toast.could_not_submit_request"),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      setIsDeleting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setClaims(prev => prev.filter(claim => claim.id !== deleteId));
      toast({
        title: t("toast.claim_deleted"),
        description: t("toast.claim_removed"),
        variant: "success",
      });
      setDeleteId(null);
      setIsDeleting(false);
    }
  };

  const handleDownloadCertificate = async (claim: Claim) => {
    setDownloadingId(claim.id);
    try {
      const userEmail = localStorage.getItem("userEmail") || "";
      
      // Search student to get osid
      const searchResults = await searchStudentByEmail(userEmail);
      if (!searchResults || searchResults.length === 0) {
        throw new Error("Student not found");
      }
      
      const studentId = searchResults[0].osid;
      const attestationName = "studentInstituteAttest";
      const attestationId = claim.attestationId || "";
      
      if (!attestationId) {
        throw new Error("Attestation ID not found");
      }
      
      const blob = await downloadStudentCertificate(studentId, attestationName, attestationId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${claim.instituteName.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: t("toast.certificate_downloaded"),
        description: t("toast.certificate_download_success"),
        variant: "success",
      });
    } catch (error) {
      toast({
        title: t("toast.download_failed"),
        description: error instanceof Error ? error.message : t("toast.could_not_download"),
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-card border border-blue-200 flex items-center justify-center shadow-sm">
              <ClipboardList className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("title.claim_requests")}
            </h1>
          </div>
          <Button onClick={handleRequestClaim} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("btn.request_claim")}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
          <Table className="relative">
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-secondary/95 backdrop-blur-sm border-b border-border/60">
                <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">{t("table.claim_id")}</TableHead>
                <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">{t("table.status")}</TableHead>
                <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingClaims ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground mt-2">{t("loading.claims")}</p>
                  </TableCell>
                </TableRow>
              ) : sortedClaims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    {t("no_data.no_claims_found")}
                  </TableCell>
                </TableRow>
              ) : (
                sortedClaims.map((claim, i) => (
                  <TableRow key={claim.id} className={`${i % 2 === 0 ? 'bg-background' : 'bg-muted/40'} hover:bg-muted/60 transition-colors`}>
                    <TableCell className="font-mono text-sm text-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">{maskClaimId(claim.attestationId || claim.id)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-mono text-xs">{claim.attestationId || claim.id}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={claim.status} pulse={claim.status === 'pending'} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {claim.status === "approved" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadCertificate(claim)}
                            disabled={downloadingId === claim.id}
                            className="bg-secondary hover:bg-muted text-foreground hover:text-foreground transition-colors"
                            title={t("tooltip.download")}
                          >
                            {downloadingId === claim.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {claim.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(claim.id)}
                            disabled
                            className="bg-secondary hover:bg-muted text-muted-foreground cursor-not-allowed transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm.request_claim")}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{t("confirm.request_claim_desc")}</p>
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-semibold text-foreground">Royal University of Phnom Penh</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("btn.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmRequest}
              className="bg-primary hover:bg-primary/90"
            >
              {t("btn.confirm_request")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Request Processing Dialog */}
      <AlertDialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isLoading ? t("confirm.requesting") : t("confirm.success")}
            </AlertDialogTitle>
            <AlertDialogDescription className="flex flex-col items-center justify-center py-4">
              {isLoading ? (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-base">{t("confirm.sending_request")}</p>
                </>
              ) : showSuccess ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-green-700">
                    {t("confirm.request_submitted_successfully")}
                  </p>
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm.delete_claim_request")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm.delete_claim_warning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("btn.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("action.deleting")}
                </>
              ) : (
                t("btn.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Claims;
