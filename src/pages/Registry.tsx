import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Pencil, Trash2, Filter, Plus, Search, SearchX, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useNavigate, useSearchParams } from "react-router-dom";
import { mockEntities, Entity } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
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
import { useToast } from "@/hooks/use-toast";

const Registry = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [entities, setEntities] = useState<Entity[]>(mockEntities);
  const [searchQuery, setSearchQuery] = useState("");
  const [schemaFilter, setSchemaFilter] = useState("All");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userRole, setUserRole] = useState<string>("admin");
  const recordsPerPage = 10;

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "admin";
    setUserRole(role);
  }, []);

  // Handle search query from URL parameters
  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
    }
  }, [searchParams]);

  const filteredEntities = entities.filter((entity) => {
    const displayName = entity.schema === "Student" ? entity.fullName : entity.name;
    const matchesSearch = displayName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSchema = schemaFilter === "All" || entity.schema === schemaFilter;
    return matchesSearch && matchesSchema;
  });

  const totalPages = Math.ceil(filteredEntities.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const paginatedEntities = filteredEntities.slice(startIndex, startIndex + recordsPerPage);

  const handleDelete = async () => {
    if (deleteId) {
      setIsDeleting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEntities(entities.filter((entity) => entity.id !== deleteId));
      toast({
        title: "🗑️ Entity deleted",
        description: "The record has been successfully removed.",
        variant: "success",
      });
      setDeleteId(null);
      setCurrentPage(1);
      setIsDeleting(false);
    }
  };

  const addButtonText = userRole === "admin" ? "Add Teacher" : "Add Student";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Registry Management</h1>
        
        <div className="flex items-center gap-4 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card font-medium rounded-lg h-11 border-input"
            />
          </div>
          <Select value={schemaFilter} onValueChange={setSchemaFilter}>
            <SelectTrigger className="w-40 bg-card font-semibold text-foreground rounded-lg h-11 border-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Student">Student</SelectItem>
              <SelectItem value="Teacher">Teacher</SelectItem>
            </SelectContent>
          </Select>
          {/* <Button variant="outline" className="gap-2 font-semibold rounded-lg h-11 border-input">
            <Filter className="h-4 w-4" />
            Filter
          </Button> */}
          <Button onClick={() => navigate("/entity/new")} className="gap-2 font-semibold rounded-lg h-11">
            <Plus className="h-4 w-4" />
            {addButtonText}
          </Button>
        </div>

        {filteredEntities.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-muted/30 via-muted/10 to-transparent overflow-hidden">
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-4 ring-primary/5">
                <SearchX className="h-8 w-8 text-primary/60" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No Records Found</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                {searchQuery || schemaFilter !== "All" 
                  ? "No entities match your search criteria"
                  : "No entities available in the system"}
              </p>
              {(searchQuery || schemaFilter !== "All") && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => { setSearchQuery(""); setSchemaFilter("All"); }}
                  className="rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  <SearchX className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
            <Table>
              <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-bold text-foreground">Name</TableHead>
                <TableHead className="font-bold text-foreground">Gender</TableHead>
                <TableHead className="font-bold text-foreground">Mobile</TableHead>
                <TableHead className="font-bold text-foreground">Email</TableHead>
                <TableHead className="font-bold text-foreground">Actions</TableHead>
              </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEntities.map((entity) => (
                <TableRow key={entity.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-semibold text-foreground">
                    {entity.schema === "Student" ? entity.fullName : entity.name}
                  </TableCell>
                  <TableCell>{entity.gender}</TableCell>
                  <TableCell className="font-medium">{entity.mobile}</TableCell>
                  <TableCell className="font-medium">{entity.email}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/entity/${entity.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/entity/${entity.id}/edit`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(entity.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {filteredEntities.length > 0 && totalPages > 1 && (
          <div className="flex justify-end mt-4">
            <Pagination>
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={cn(
                      "cursor-pointer rounded-lg border-2 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all",
                      currentPage === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className={cn(
                        "cursor-pointer rounded-lg border-2 transition-all",
                        currentPage === page 
                          ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" 
                          : "border-border hover:bg-primary/10 hover:border-primary hover:text-primary"
                      )}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={cn(
                      "cursor-pointer rounded-lg border-2 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all",
                      currentPage === totalPages && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
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

export default Registry;
