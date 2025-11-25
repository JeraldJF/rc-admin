import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useState, useEffect } from "react";
import { getTeacherClaims, Claim as ApiClaim } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
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
        title: "❌ Failed to load claims",
        description: error instanceof Error ? error.message : "Could not fetch approved claims",
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
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Approved Claims</h1>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg p-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading approved claims...</span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-bold text-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Student Name
                    </div>
                  </TableHead>
                  <TableHead className="font-bold text-foreground">Institute Name</TableHead>
                  <TableHead className="font-bold text-foreground">
                    <button
                      onClick={toggleSort}
                      className="flex items-center gap-2 hover:text-primary transition-colors font-bold"
                    >
                      Time approved
                      {getSortIcon()}
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No approved claims
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedClaims.map((claim) => (
                    <TableRow key={claim.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ApprovedClaims;
