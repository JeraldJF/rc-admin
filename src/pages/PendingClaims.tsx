import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { mockClaims, Claim } from "@/data/claimsData";
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
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type SortOrder = "asc" | "desc" | null;

const PendingClaims = () => {
  const { toast } = useToast();
  const [claims, setClaims] = useState<Claim[]>(
    mockClaims.filter((claim) => claim.status === "pending")
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  // Sort claims by date
  const sortedClaims = [...claims].sort((a, b) => {
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

  const handleApprove = (claimId: string) => {
    setClaims((prev) => prev.filter((claim) => claim.id !== claimId));
    toast({
      title: "✅ Claim approved",
      description: "The claim has been successfully approved.",
      variant: "success",
    });
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
        <h1 className="text-2xl font-bold text-foreground">Pending Claims</h1>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-bold text-foreground">Student Name</TableHead>
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
                    <TableCell className="font-semibold text-foreground">{claim.studentName}</TableCell>
                    <TableCell className="font-medium">{claim.instituteName}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">{formatDistanceToNow(new Date(claim.dateRequested), { addSuffix: true })}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{new Date(claim.dateRequested).toLocaleString()}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(claim.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
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
      </div>
    </DashboardLayout>
  );
};

export default PendingClaims;
