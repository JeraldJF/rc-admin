import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTeacherClaims, attestClaim, Claim as ApiClaim } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { ArrowUpDown, ArrowUp, ArrowDown, Clock, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

type SortOrder = "asc" | "desc" | null;

interface ClaimData {
  id: string;
  studentName: string;
  email: string;
  instituteName: string;
  status: string;
  requestedOn: string;
}

const PendingClaims = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [userRole, setUserRole] = useState<string>("");
  const [claims, setClaims] = useState<ClaimData[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isLoading, setIsLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  
  useEffect(() => {
    const role = localStorage.getItem("userRole") || "admin";
    setUserRole(role);
    
    // Fetch pending claims for teachers
    if (role === "teacher") {
      fetchPendingClaims();
    }
  }, []);
  
  const fetchPendingClaims = async () => {
    setIsLoading(true);
    try {
      const response = await getTeacherClaims();
      
      // Filter for OPEN status claims and transform data
      const pendingClaims: ClaimData[] = response.content
        .filter((claim: ApiClaim) => claim.status === "OPEN")
        .map((claim: ApiClaim) => {
          const propertyData = JSON.parse(claim.propertyData);
          return {
            id: claim.id,
            studentName: propertyData.fullName || claim.requestorName,
            email: propertyData.email || claim.requestorName,
            instituteName: propertyData.instituteName || "",
            status: "pending",
            requestedOn: claim.createdAt,
          };
        });
      
      setClaims(pendingClaims);
    } catch (error) {
      toast({
        title: t("toast.failed_load_claims"),
        description: error instanceof Error ? error.message : t("toast.could_not_fetch_pending_claims"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sort claims by date
  const sortedClaims = [...claims].sort((a, b) => {
    if (!sortOrder) return 0;
    const dateA = new Date(a.requestedOn).getTime();
    const dateB = new Date(b.requestedOn).getTime();
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

  const handleApprove = async (claimId: string) => {
    setApprovingId(claimId);
    try {
      await attestClaim(claimId);
      
      setClaims((prev) => prev.filter((claim) => claim.id !== claimId));
      toast({
        title: t("toast.claim_approved"),
        description: t("toast.claim_approved_desc"),
        variant: "success",
      });
    } catch (error) {
      toast({
        title: t("toast.failed_approve"),
        description: error instanceof Error ? error.message : t("toast.failed_approve_desc"),
        variant: "destructive",
      });
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = (claimId: string) => {
    setClaims((prev) => prev.filter((claim) => claim.id !== claimId));
    toast({
      title: t("toast.claim_rejected"),
      description: t("toast.claim_rejected_desc"),
      variant: "error",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-card border border-amber-200 flex items-center justify-center shadow-sm">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title.pending_claims")}</h1>
            {claims.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700">
                {claims.length}
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
          <Table className="relative">
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-secondary/95 backdrop-blur-sm border-b border-border/60">
                <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning-foreground" />
                    {t("table.student_name")}
                  </div>
                </TableHead>
                <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">{t("form.institute_name")}</TableHead>
                <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">
                  <button
                    onClick={toggleSort}
                    className="flex items-center gap-2 hover:text-primary transition-colors font-medium"
                    aria-label="Toggle sort for pending time"
                    aria-pressed={sortOrder !== null}
                  >
                    {t("table.pending_since")}
                    {getSortIcon()}
                  </button>
                </TableHead>
                <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">{t("table.status")}</TableHead>
                <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground mt-2">{t("loading.claims")}</p>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && claims.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    {t("no_data.no_records")}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && sortedClaims.map((claim, i) => (
                <TableRow
                  key={claim.id}
                  className={`${i % 2 === 0 ? 'bg-background' : 'bg-muted/40'} hover:bg-muted/60 transition-colors`}
                >
                  <TableCell className="font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-warning-foreground animate-pulse" />
                      {claim.studentName}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{claim.instituteName}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            {formatDistanceToNow(new Date(claim.requestedOn), { addSuffix: true })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{new Date(claim.requestedOn).toLocaleString()}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status="pending" pulse />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(claim.id)}
                        disabled={approvingId === claim.id}
                        className="bg-green-100 text-green-700 hover:bg-green-200 focus-visible:ring-2 focus-visible:ring-green-500/40 border border-green-300 flex items-center gap-1.5 font-medium transition-all dark:bg-green-900/40 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-800/60"
                      >
                        {approvingId === claim.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            {t("action.approving")}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t("btn.approve")}
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        onClick={() => handleReject(claim.id)}
                        className="bg-secondary hover:bg-muted text-foreground hover:text-foreground border-border flex items-center gap-1.5 font-medium transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        {t("btn.reject")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PendingClaims;
