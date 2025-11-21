import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpDown, ArrowUp, ArrowDown, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Claim } from "@/data/claimsData";
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Get student's name from email
    const userEmail = localStorage.getItem("userEmail") || "";
    const studentName = userEmail.split("@")[0];
    
    // Add some initial mock claims with various statuses
    const initialClaims: Claim[] = [
      {
        id: "claim-1",
        studentName: studentName.charAt(0).toUpperCase() + studentName.slice(1),
        instituteName: "Royal University of Science and Technology",
        teacherName: "Dr. Sarah Johnson",
        dateRequested: "2024-11-18",
        dateApproved: "2024-11-19",
        status: "approved",
      },
      {
        id: "claim-2",
        studentName: studentName.charAt(0).toUpperCase() + studentName.slice(1),
        instituteName: "National University of Management",
        dateRequested: "2024-11-17",
        status: "pending",
      },
      {
        id: "claim-3",
        studentName: studentName.charAt(0).toUpperCase() + studentName.slice(1),
        instituteName: "Institute of Technology of Cambodia",
        dateRequested: "2024-11-15",
        status: "rejected",
      },
    ];
    
    setClaims(initialClaims);
  }, []);

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

  const handleRequestClaim = () => {
    // Check if there's already a pending or approved claim for this institute
    const existingClaim = claims.find(
      claim => claim.instituteName === "Royal University of Phnom Penh" && 
      (claim.status === "pending" || claim.status === "approved")
    );
    
    if (existingClaim) {
      toast({
        title: "❌ Cannot submit request",
        description: `You already have a ${existingClaim.status} claim for this institute. Please wait for it to be processed or rejected.`,
        variant: "destructive",
      });
      return;
    }
    
    // Show confirmation dialog first
    setShowConfirmDialog(true);
  };

  const handleConfirmRequest = () => {
    setShowConfirmDialog(false);
    setShowRequestDialog(true);
    setIsLoading(true);
    setShowSuccess(false);
    
    // Simulate loading for 2-3 seconds
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccess(true);
      
      // Add new claim to the table
      const userEmail = localStorage.getItem("userEmail") || "";
      const studentName = userEmail.split("@")[0];
      const newClaim: Claim = {
        id: `claim-${Date.now()}`,
        studentName: studentName.charAt(0).toUpperCase() + studentName.slice(1),
        instituteName: "Royal University of Phnom Penh",
        dateRequested: new Date().toISOString(),
        status: "pending",
      };
      setClaims(prev => [newClaim, ...prev]);
      
      // Auto-close dialog after 2-3 seconds
      setTimeout(() => {
        setShowRequestDialog(false);
        setIsLoading(false);
        setShowSuccess(false);
      }, 2500);
    }, 2500);
  };

  const handleDelete = async () => {
    if (deleteId) {
      setIsDeleting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setClaims(prev => prev.filter(claim => claim.id !== deleteId));
      toast({
        title: "🗑️ Request for claim successfully deleted",
        description: "The claim has been removed from your records.",
        variant: "success",
      });
      setDeleteId(null);
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Claim Requests</h1>
          <Button onClick={handleRequestClaim} className="gap-2">
            <Plus className="h-4 w-4" />
            Request For Claim
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-bold text-foreground">Institute Name</TableHead>
                <TableHead className="font-bold text-foreground">Teacher Name</TableHead>
                <TableHead className="font-bold text-foreground">
                  <button
                    onClick={toggleSort}
                    className="flex items-center gap-2 hover:text-primary transition-colors font-bold"
                  >
                    Date
                    {getSortIcon()}
                  </button>
                </TableHead>
                <TableHead className="font-bold text-foreground">Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedClaims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No claims found. Click "Request For Claim" to submit a new request.
                  </TableCell>
                </TableRow>
              ) : (
                sortedClaims.map((claim) => (
                  <TableRow key={claim.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-foreground">{claim.instituteName}</TableCell>
                    <TableCell className="font-medium">
                      {claim.status === "approved" && claim.teacherName ? claim.teacherName : "-"}
                    </TableCell>
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
                    <TableCell>
                      {claim.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(claim.id)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
            <AlertDialogTitle>Request Claim Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Are you sure you want to submit a claim request for:</p>
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-semibold text-foreground">Royal University of Phnom Penh</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmRequest}
              className="bg-primary hover:bg-primary/90"
            >
              Confirm Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Request Processing Dialog */}
      <AlertDialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isLoading ? "Requesting Claim" : "Success"}
            </AlertDialogTitle>
            <AlertDialogDescription className="flex flex-col items-center justify-center py-4">
              {isLoading ? (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-base">Sending request for claim...</p>
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
                    Request for claim submitted successfully!
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
            <AlertDialogTitle>Delete Claim Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this claim request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Claims;
