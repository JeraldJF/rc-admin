import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, SearchX, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Database } from "lucide-react";
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
import { searchAllEmployees } from "@/lib/employeeApi";

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
  degree?: string;
  isAttested?: boolean;
}

const Registry = () => {
  const { t } = useLanguage();
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
    const role = sessionStorage.getItem("userRole") || "admin";
    setUserRole(role);

    // Fetch employees
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await searchAllEmployees();
    
      // Handle the various ways Sunbird RC can return data
      // Based on provided JSON: { "totalCount": 7, "data": [...] }
      let employeesArray = [];
      if (Array.isArray(response)) {
        employeesArray = response;
      } else if (response && typeof response === 'object') {
        // High priority for the 'data' property as per user JSON
        const listData = response.data || response.Employee || response.result || response.content;

        if (Array.isArray(listData)) {
          employeesArray = listData;
        } else if (listData && typeof listData === 'object' && Array.isArray(listData.content)) {
          employeesArray = listData.content;
        } else if (response.osid) {
          employeesArray = [response];
        }
      }

      // Transform API response to EntityData format
      // Sunbird RC returns BOTH the actual employee record AND a wrapper record with nested Employee object
      // We need to deduplicate by the actual employee osid
      const seenOsids = new Set<string>();
      
      const employeeData: EntityData[] = employeesArray
        .filter((employee: any) => {
          // Extract the actual employee data (handle both flat and nested structures)
          const actualEmployee = employee.Employee || employee;
          const actualOsid = actualEmployee.osid || actualEmployee.id;
          
          // Skip records without osid or id
          if (!actualOsid) return false;
          
          // Skip duplicate osids (Sunbird RC returns both wrapper and actual records)
          if (seenOsids.has(actualOsid)) return false;
          seenOsids.add(actualOsid);
          
          // Skip records that are just empty objects or have no meaningful data
          const flatName = actualEmployee.fullName || actualEmployee.firstName || actualEmployee.lastName || actualEmployee.name;
          const flatEmail = actualEmployee.email;
          const nestedName = actualEmployee.identityDetails?.fullName;
          const nestedEmail = actualEmployee.contactDetails?.email;
          
          // Must have either a name or email to be considered a valid employee record
          return !!(flatName || nestedName || flatEmail || nestedEmail);
        })
        .map((employee: any) => {
          // Extract the actual employee data (prioritize nested Employee object if it exists)
          const actualEmployee = employee.Employee || employee;
          
          // Flat schema fields (prioritized)
          const flatName = actualEmployee.fullName
            || (actualEmployee.firstName && actualEmployee.lastName
              ? `${actualEmployee.firstName} ${actualEmployee.lastName}`.trim()
              : actualEmployee.name);
          const flatEmail = actualEmployee.email;
          const flatMobile = actualEmployee.phoneNumber || actualEmployee.mobile;
          const flatEmpNum = actualEmployee.employeeNumber || actualEmployee.personalIdentification;

          // Nested schema fields (fallback)
          const nestedName = actualEmployee.identityDetails?.fullName;
          const nestedEmail = actualEmployee.contactDetails?.email;
          const nestedMobile = actualEmployee.contactDetails?.mobile;
          const nestedEmpNum = actualEmployee.identityDetails?.employeeNumber || actualEmployee.identityDetails?.personalIdentification;

          return {
            id: actualEmployee.osid || actualEmployee.id,
            name: flatName || nestedName || 'N/A',
            email: flatEmail || nestedEmail || 'N/A',
            instituteName: (flatEmpNum || nestedEmpNum) ? `ID: ${flatEmpNum || nestedEmpNum}` : actualEmployee.instituteName || 'N/A',
            mobile: flatMobile || nestedMobile,
            created: actualEmployee.osCreatedAt || actualEmployee.createdAt || actualEmployee.osCreatedAt || '2024-01-01T00:00:00Z',
            updated: actualEmployee.osUpdatedAt || actualEmployee.updatedAt || actualEmployee.osUpdatedAt || '2024-01-01T00:00:00Z',
          };
        });
    

      setEntities(employeeData);
    } catch (error) {
      toast({
        title: t("toast.failed_load_employees") || "Failed to load employees",
        description: error instanceof Error ? error.message : t("toast.could_not_fetch_employees") || "Could not fetch employees",
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
        title: t("toast.entity_deleted"),
        description: t("toast.record_removed"),
        variant: "success",
      });
      setDeleteId(null);
      setCurrentPage(1);
      setIsDeleting(false);
    }
  };

  const addButtonText = "Add Employee";
  const pageTitle = "Employee Management";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-card border border-purple-200 flex items-center justify-center shadow-sm">
            <Database className="h-6 w-6 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center gap-4 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
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

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border/60">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-t-2 border-r-2 border-primary animate-spin"></div>
              <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-primary/10"></div>
              <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
            </div>
            <p className="mt-4 text-sm font-semibold text-muted-foreground animate-pulse">
              Syncing with Registry...
            </p>
          </div>
        ) : filteredEntities.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-muted/30 via-muted/10 to-transparent overflow-hidden">
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-4 ring-primary/5">
                <SearchX className="h-8 w-8 text-primary/60" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{t("no_data.no_records")}</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                {searchQuery
                  ? t("no_data.no_match_criteria")
                  : t("no_data.no_entities_available")}
              </p>
              {searchQuery && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  <SearchX className="mr-2 h-4 w-4" />
                  {t("action.clear_filters")}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
            <Table className="relative">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-secondary/95 backdrop-blur-sm border-b border-border/60">
                  <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">{t("table.name")}</TableHead>
                  <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">
                    <button
                      onClick={() => toggleSort("created")}
                      className="flex items-center gap-2 hover:text-primary transition-colors font-medium"
                    >
                      {t("table.created_on")}
                      {getSortIcon("created")}
                    </button>
                  </TableHead>
                  <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">
                    <button
                      onClick={() => toggleSort("updated")}
                      className="flex items-center gap-2 hover:text-primary transition-colors font-medium"
                    >
                      {t("table.updated_on")}
                      {getSortIcon("updated")}
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEntities.map((entity, i) => (
                  <TableRow key={entity.id} className={cn("transition-colors", i % 2 === 0 ? "bg-background" : "bg-muted/40", "hover:bg-muted/60")}>
                    <TableCell className="font-medium text-foreground">
                      {entity.name}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <div className="text-sm font-medium text-foreground">
                                {new Date(entity.created).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(entity.created).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-mono text-xs">{new Date(entity.created).toLocaleString()}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <div className="text-sm font-medium text-foreground">
                                {new Date(entity.updated).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(entity.updated).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-mono text-xs">{new Date(entity.updated).toLocaleString()}</p>
                          </TooltipContent>
                        </Tooltip>
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
            <AlertDialogTitle>{t("confirm.are_you_sure")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm.delete_warning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("btn.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("action.deleting")}
                </>
              ) : (
                t("action.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Registry;
