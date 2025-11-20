import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { mockClaims } from "@/data/claimsData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ApprovedClaims = () => {
  const approvedClaims = mockClaims.filter((claim) => claim.status === "approved");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Approved Claims</h1>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-left font-semibold">Name</TableHead>
                <TableHead className="text-left font-semibold">Institute Name</TableHead>
                <TableHead className="text-left font-semibold">Time Approved</TableHead>
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
                approvedClaims.map((claim) => (
                  <TableRow key={claim.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{claim.studentName}</TableCell>
                    <TableCell>{claim.instituteName}</TableCell>
                    <TableCell>{claim.dateApproved || claim.dateRequested}</TableCell>
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
