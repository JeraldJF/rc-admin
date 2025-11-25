import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Pencil, Trash2, Plus, Search, SearchX, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { searchAllTeachers, searchAllStudents } from "@/lib/api";

type SortOrder = "asc" | "desc" | null;
type SortField = "created" | "updated" | null;

interface EntityData {
  id: string;
  name: string;
  email: string;
  instituteName: string;
  mobile?: string;
  created: string;
  updated: string;
}

const Registry = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [entities, setEntities] = useState<EntityData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>("admin");
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const recordsPerPage = 10;

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "admin";
    setUserRole(role);
    
    // Fetch entities based on role
    if (role === "admin") {
      fetchTeachers();
    } else if (role === "teacher") {
      fetchStudents();
    }
  }, []);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const response = await searchAllTeachers();
      
      // Transform API response to EntityData format
      const teacherData: EntityData[] = response.map((teacher: any) => ({
        id: teacher.osid,
        name: teacher.name,
        email: teacher.email,
        instituteName: teacher.instituteName,
        mobile: teacher.mobile,
        created: teacher.osCreatedAt,
        updated: teacher.osUpdatedAt,
      }));
      
      setEntities(teacherData);
    } catch (error) {
      toast({
        title: "❌ Failed to load teachers",
        description: error instanceof Error ? error.message : "Could not fetch teachers list",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await searchAllStudents();
      
      // Transform API response to EntityData format
      const studentData: EntityData[] = response.map((student: any) => ({
        id: student.osid,
        name: student.fullName,
        email: student.email,
        instituteName: student.instituteName,
        mobile: student.mobile,
        created: student.osCreatedAt,
        updated: student.osUpdatedAt,
      }));
      
      setEntities(studentData);
    } catch (error) {
      toast({
        title: "❌ Failed to load students",
        description: error instanceof Error ? error.message : "Could not fetch students list",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search query from URL parameters
  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
    }
  }, [searchParams]);

  const filteredEntities = entities.filter((entity) => {
    const matchesSearch = entity.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Sort entities if sort field is set
  const sortedEntities = [...filteredEntities].sort((a, b) => {
    if (!sortField || !sortOrder) return 0;
    
    const dateA = new Date(a[sortField]).getTime();
    const dateB = new Date(b[sortField]).getTime();
    
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  const totalPages = Math.ceil(sortedEntities.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const paginatedEntities = sortedEntities.slice(startIndex, startIndex + recordsPerPage);

  const toggleSort = (field: "created" | "updated") => {
    if (sortField === field) {
      // Cycle through: desc -> asc -> null
      if (sortOrder === "desc") setSortOrder("asc");
      else if (sortOrder === "asc") {
        setSortOrder(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: "created" | "updated") => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    if (sortOrder === "desc") return <ArrowDown className="h-4 w-4" />;
    if (sortOrder === "asc") return <ArrowUp className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4" />;
  };

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
  const pageTitle = userRole === "admin" ? "Teacher Management" : "Student Management";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">{pageTitle}</h1>
        
        <div className="flex items-center gap-4 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={userRole === "admin" ? "Search teachers..." : "Search students..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card font-medium rounded-lg h-11 border-input"
            />
          </div>
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
                {searchQuery 
                  ? "No entities match your search criteria"
                  : "No entities available in the system"}
              </p>
              {searchQuery && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setSearchQuery("")}
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
                {/* {userRole === "admin" && (
                  <TableHead className="font-bold text-foreground">Institute Name</TableHead>
                )} */}
                <TableHead className="font-bold text-foreground">
                  <button
                    onClick={() => toggleSort("created")}
                    className="flex items-center gap-2 hover:text-primary transition-colors font-bold"
                  >
                    Created On
                    {getSortIcon("created")}
                  </button>
                </TableHead>
                <TableHead className="font-bold text-foreground">
                  <button
                    onClick={() => toggleSort("updated")}
                    className="flex items-center gap-2 hover:text-primary transition-colors font-bold"
                  >
                    Updated On
                    {getSortIcon("updated")}
                  </button>
                </TableHead>
                <TableHead className="font-bold text-foreground">Actions</TableHead>
              </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEntities.map((entity) => (
                <TableRow key={entity.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-semibold text-foreground">
                    {entity.name}
                  </TableCell>
                  {/* {userRole === "admin" && (
                    <TableCell className="font-medium">{entity.instituteName}</TableCell>
                  )} */}
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            {formatDistanceToNow(new Date(entity.created), { addSuffix: true })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{new Date(entity.created).toLocaleString()}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            {formatDistanceToNow(new Date(entity.updated), { addSuffix: true })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{new Date(entity.updated).toLocaleString()}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
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
                        
                        {/* Delete button disabled for now */}
                        {/* <Tooltip>
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
                        </Tooltip> */}
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
          <div className="flex justify-center mt-8">
            <Pagination>
              <PaginationContent className="gap-2">
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
