import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, SearchX, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Database } from "lucide-react";
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
type SortField = "admissionDate" | null;

interface EntityData {
  id: string;
  name: string;
  email: string;
  instituteName: string;
  mobile?: string;
  admissionDate: string;
  positionName: string;
  degree?: string;
  isAttested?: boolean;
}

const Registry = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [allEntities, setAllEntities] = useState<EntityData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>("admin");
  const [sortField, setSortField] = useState<SortField>("admissionDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const recordsPerPage = 100;

  useEffect(() => {
    const role = sessionStorage.getItem("userRole") || "admin";
    setUserRole(role);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchEmployees(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (allEntities.length === 0) fetchEmployees(searchQuery);
  }, []);

  const fetchEmployees = async (nameFilter: string) => {
    setIsLoading(true);
    try {
      // Fetch all records at once — Sunbird RC returns wrapper+flat duplicates per employee,
      // so offset-based pagination skips half the records. Deduplicate here, paginate client-side.
      const response = await searchAllEmployees(2000, 0, nameFilter || undefined);

      let employeesArray: any[] = [];
      if (Array.isArray(response)) {
        employeesArray = response;
      } else if (response && typeof response === 'object') {
        const listData = response.data || response.Employee || response.result || response.content;
        if (Array.isArray(listData)) {
          employeesArray = listData;
        } else if (listData && typeof listData === 'object' && Array.isArray(listData.content)) {
          employeesArray = listData.content;
        } else if (response.osid) {
          employeesArray = [response];
        }
      }

      const seenOsids = new Set<string>();
      const employeeData: EntityData[] = employeesArray
        .filter((employee: any) => {
          const actualEmployee = employee.Employee || employee;
          const actualOsid = actualEmployee.osid || actualEmployee.id;
          if (!actualOsid) return false;
          if (seenOsids.has(actualOsid)) return false;
          seenOsids.add(actualOsid);
          const name = actualEmployee.fullName || actualEmployee.firstName || actualEmployee.lastName || actualEmployee.name || actualEmployee.identityDetails?.fullName;
          const email = actualEmployee.email || actualEmployee.contactDetails?.email;
          return !!(name || email);
        })
        .map((employee: any) => {
          const actualEmployee = employee.Employee || employee;
          const flatName = actualEmployee.fullName
            || (actualEmployee.firstName && actualEmployee.lastName
              ? `${actualEmployee.firstName} ${actualEmployee.lastName}`.trim()
              : actualEmployee.name);
          return {
            id: actualEmployee.osid || actualEmployee.id,
            name: flatName || actualEmployee.identityDetails?.fullName || 'N/A',
            email: actualEmployee.email || actualEmployee.contactDetails?.email || 'N/A',
            instituteName: (actualEmployee.employeeNumber || actualEmployee.personalIdentification || actualEmployee.identityDetails?.employeeNumber)
              ? `ID: ${actualEmployee.employeeNumber || actualEmployee.personalIdentification || actualEmployee.identityDetails?.employeeNumber}`
              : actualEmployee.instituteName || 'N/A',
            mobile: actualEmployee.phoneNumber || actualEmployee.mobile || actualEmployee.contactDetails?.mobile,
            admissionDate: actualEmployee.admissionDate || '',
            positionName: actualEmployee.positionName || '',
          };
        });

      setAllEntities(employeeData);
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

  const sortedEntities = [...allEntities].sort((a, b) => {
    if (!sortField || !sortOrder) return 0;
    const dateA = new Date(a.admissionDate).getTime() || 0;
    const dateB = new Date(b.admissionDate).getTime() || 0;
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  const totalPages = Math.ceil(sortedEntities.length / recordsPerPage);
  const startIdx = (currentPage - 1) * recordsPerPage;
  const paginatedEntities = sortedEntities.slice(startIdx, startIdx + recordsPerPage);

  const toggleSort = () => {
    if (sortField === "admissionDate") {
      if (sortOrder === "desc") setSortOrder("asc");
      else if (sortOrder === "asc") {
        setSortOrder(null);
        setSortField(null);
      }
    } else {
      setSortField("admissionDate");
      setSortOrder("desc");
    }
  };

  const getSortIcon = () => {
    if (sortField !== "admissionDate") return <ArrowUpDown className="h-4 w-4" />;
    if (sortOrder === "desc") return <ArrowDown className="h-4 w-4" />;
    if (sortOrder === "asc") return <ArrowUp className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4" />;
  };

  const handleDelete = async () => {
    if (deleteId) {
      setIsDeleting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setAllEntities(allEntities.filter((entity) => entity.id !== deleteId));
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
        ) : allEntities.length === 0 ? (
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
          <div className="rounded-xl border border-border bg-card overflow-x-auto shadow-lg">
            <Table className="relative w-full table-fixed">
              <colgroup>
                <col className="w-[45%]" />
                <col className="w-[15%]" />
                <col className="w-[40%]" />
              </colgroup>
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-secondary/95 backdrop-blur-sm border-b border-border/60">
                  <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">{t("table.name")}</TableHead>
                  <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">
                    <button
                      onClick={toggleSort}
                      className="flex items-center gap-2 hover:text-primary transition-colors font-medium"
                    >
                      Joining Date
                      {getSortIcon()}
                    </button>
                  </TableHead>
                  <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">Designation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEntities.map((entity, i) => (
                  <TableRow key={entity.id} className={cn("transition-colors", i % 2 === 0 ? "bg-background" : "bg-muted/40", "hover:bg-muted/60")}>
                    <TableCell className="font-medium text-foreground truncate">
                      {entity.name}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {/^\d{4}-\d{2}-\d{2}/.test(entity.admissionDate) ? entity.admissionDate : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-foreground truncate">
                      {entity.positionName || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 0 && (
          <div className="flex justify-center mt-8">
            <Pagination>
              <PaginationContent className="gap-2">
                <PaginationItem>
                  <PaginationLink
                    onClick={() => setCurrentPage(1)}
                    className={cn(
                      "cursor-pointer rounded-lg border-2 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all",
                      currentPage === 1 && "pointer-events-none opacity-50"
                    )}
                  >
                    «
                  </PaginationLink>
                </PaginationItem>

                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={cn(
                      "cursor-pointer rounded-lg border-2 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all",
                      currentPage === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(10, totalPages - currentPage + 1) }, (_, i) => currentPage + i).map(page => (
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

                <PaginationItem>
                  <PaginationLink
                    onClick={() => setCurrentPage(totalPages)}
                    className={cn(
                      "cursor-pointer rounded-lg border-2 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all",
                      currentPage === totalPages && "pointer-events-none opacity-50"
                    )}
                  >
                    »
                  </PaginationLink>
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