import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { mockClaims } from "@/data/claimsData";
import { useState } from "react";
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

const ApprovedClaims = () => {
  const approvedClaims = mockClaims.filter((claim) => claim.status === "approved");
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  // Sort claims by date
  const sortedClaims = [...approvedClaims].sort((a, b) => {
    if (!sortOrder) return 0;
    const dateA = new Date(a.dateApproved || a.dateRequested).getTime();
    const dateB = new Date(b.dateApproved || b.dateRequested).getTime();
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
        <h1 className="text-2xl font-bold text-foreground">Approved Claims</h1>

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
                    Time approved
                    {getSortIcon()}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedClaims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No approved claims
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
                            <span className="cursor-help">{formatDistanceToNow(new Date(claim.dateApproved || claim.dateRequested), { addSuffix: true })}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{new Date(claim.dateApproved || claim.dateRequested).toLocaleString()}</p>
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
      </div>
    </DashboardLayout>
  );
};

export default ApprovedClaims;
