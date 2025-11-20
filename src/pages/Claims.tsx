import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockClaims } from "@/data/claimsData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Claims = () => {
  const { toast } = useToast();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [claims] = useState(mockClaims.slice(0, 3)); // Show first 3 as student's claims

  const handleRequestClaim = () => {
    setShowRequestDialog(true);
  };

  const handleCloseDialog = () => {
    setShowRequestDialog(false);
    toast({
      title: "✅ Claim requested",
      description: "Request for claim successfully submitted. It is now pending approval.",
      variant: "success",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Claim Management</h1>
          <Button onClick={handleRequestClaim} className="gap-2">
            <Plus className="h-4 w-4" />
            Request Claim
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-left font-semibold">Institute Name</TableHead>
                <TableHead className="text-left font-semibold">Teacher Name</TableHead>
                <TableHead className="text-left font-semibold">Date</TableHead>
                <TableHead className="text-left font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <TableRow key={claim.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{claim.instituteName}</TableCell>
                  <TableCell>
                    {claim.status === "approved" && claim.teacherName ? claim.teacherName : "-"}
                  </TableCell>
                  <TableCell>{claim.dateRequested}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        claim.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : claim.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Claim Request Submitted</AlertDialogTitle>
            <AlertDialogDescription>
              Request for claim successfully submitted. It is now pending approval.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCloseDialog}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Claims;
