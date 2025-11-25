import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
import { ArrowUpDown, ArrowUp, ArrowDown, Clock, Loader2 } from "lucide-react";

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
        title: "❌ Failed to load claims",
        description: error instanceof Error ? error.message : "Could not fetch pending claims",
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
        title: "✅ Claim approved",
        description: "The claim has been successfully approved.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "❌ Failed to approve claim",
        description: error instanceof Error ? error.message : "Could not approve the claim",
        variant: "destructive",
      });
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = (claimId: string) => {
    setClaims((prev) => prev.filter((claim) => claim.id !== claimId));
    toast({
      title: "❌ Claim rejected",
      description: "The claim has been rejected.",
      variant: "error",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Pending Claims</h1>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg p-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading pending claims...</span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
            <Table>
              <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-bold text-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    Student Name
                  </div>
                </TableHead>
                <TableHead className="font-bold text-foreground">Institute Name</TableHead>
                <TableHead className="font-bold text-foreground">
                  <button
                    onClick={toggleSort}
                    className="flex items-center gap-2 hover:text-primary transition-colors font-bold"
                  >
                    Pending since
                    {getSortIcon()}
                  </button>
                </TableHead>
                <TableHead className="font-bold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No pending claims
                  </TableCell>
                </TableRow>
              ) : (
                sortedClaims.map((claim) => (
                  <TableRow key={claim.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
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
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(claim.id)}
                          disabled={approvingId === claim.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {approvingId === claim.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              Approving...
                            </>
                          ) : (
                            "Approve"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled
                          onClick={() => handleReject(claim.id)}
                        >
                          Reject
                        </Button>
                      </div>
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

export default PendingClaims;
