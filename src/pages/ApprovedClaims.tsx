import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useState, useEffect } from "react";
import { getTeacherClaims, Claim as ApiClaim } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

type SortOrder = "asc" | "desc" | null;

interface ClaimData {
  id: string;
  studentName: string;
  email: string;
  instituteName: string;
  status: string;
  approvedOn: string;
}

const ApprovedClaims = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [claims, setClaims] = useState<ClaimData[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const role = localStorage.getItem("userRole") || "admin";
    
    // Fetch approved claims for teachers
    if (role === "teacher") {
      fetchApprovedClaims();
    }
  }, []);
  
  const fetchApprovedClaims = async () => {
    setIsLoading(true);
    try {
      const response = await getTeacherClaims();
      
      // Filter for CLOSED status claims and transform data
      const approvedClaims: ClaimData[] = response.content
        .filter((claim: ApiClaim) => claim.status === "CLOSED")
        .map((claim: ApiClaim) => {
          const propertyData = JSON.parse(claim.propertyData);
          return {
            id: claim.id,
            studentName: propertyData.fullName || claim.requestorName,
            email: propertyData.email || claim.requestorName,
            instituteName: propertyData.instituteName || "",
            status: "approved",
            approvedOn: claim.attestedOn || claim.updatedAt,
          };
        });
      
      setClaims(approvedClaims);
    } catch (error) {
      toast({
        title: "❌ " + t("toast.failed_load_claims"),
        description: error instanceof Error ? error.message : t("toast.could_not_fetch"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sort claims by date
  const sortedClaims = [...claims].sort((a, b) => {
    if (!sortOrder) return 0;
    const dateA = new Date(a.approvedOn).getTime();
    const dateB = new Date(b.approvedOn).getTime();
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-card border border-green-200 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("title.approved_claims")}
            </h1>
            {claims.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700">
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
                    <CheckCircle2 className="h-4 w-4 text-success-foreground" />
                    {t("table.student_name")}
                  </div>
                </TableHead>
                <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">{t("form.institute_name")}</TableHead>
                <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">
                  <button
                    onClick={toggleSort}
                    className="flex items-center gap-2 hover:text-primary transition-colors font-medium"
                    aria-label="Toggle sort for time approved"
                    aria-pressed={sortOrder !== null}
                  >
                    {t("table.time_approved")}
                    {getSortIcon()}
                  </button>
                </TableHead>
                <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">{t("table.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground mt-2">{t("loading.claims")}</p>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && claims.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
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
                      <div className="h-2 w-2 rounded-full bg-success-foreground" />
                      {claim.studentName}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{claim.instituteName}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">{formatDistanceToNow(new Date(claim.approvedOn), { addSuffix: true })}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{new Date(claim.approvedOn).toLocaleString()}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status="approved" />
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

export default ApprovedClaims;
