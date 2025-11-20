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

const PendingClaims = () => {
  const { toast } = useToast();
  const [claims, setClaims] = useState<Claim[]>(
    mockClaims.filter((claim) => claim.status === "pending")
  );

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

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-left font-semibold">Name</TableHead>
                <TableHead className="text-left font-semibold">Institute Name</TableHead>
                <TableHead className="text-left font-semibold">Time</TableHead>
                <TableHead className="text-left font-semibold">Actions</TableHead>
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
                claims.map((claim) => (
                  <TableRow key={claim.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{claim.studentName}</TableCell>
                    <TableCell>{claim.instituteName}</TableCell>
                    <TableCell>{claim.dateRequested}</TableCell>
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
