import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Save, User, Loader2, Shield, AlertCircle, Download, Edit2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  searchTeacherByEmail, 
  getTeacherById, 
  searchStudentByEmail,
  getStudentById,
  searchAdminByEmail,
  getAdminById,
  TeacherProfile,
  StudentProfile,
  updateStudent,
  updateTeacher,
  attestFieldClaim,
  downloadStudentCertificate
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

const FormField = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-2.5">{children}</div>
);

const ViewProfile = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("admin");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [claims, setClaims] = useState<any[]>([]);
  const [hasPendingClaims, setHasPendingClaims] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasPublishedAttestation, setHasPublishedAttestation] = useState(false);
  const [originalAttestableData, setOriginalAttestableData] = useState<{
    fullName?: string;
    degree?: string;
    grade?: string;
    instituteName?: string;
  }>({});
  
  const [formData, setFormData] = useState({
    fullName: "",
    gender: "Male",
    mobile: "",
    email: "",
    instituteName: "",
    dob: "",
    degree: "",
    grade: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    const role = localStorage.getItem("userRole") || "admin";
    setUserRole(role);
    
    if (userEmail) {
      const emailUsername = userEmail.split("@")[0];
      setUsername(emailUsername);
      
      // Fetch profile data based on role
      if (role === "teacher") {
        fetchTeacherProfile(userEmail);
      } else if (role === "student") {
        fetchStudentProfile(userEmail);
      } else if (role === "admin") {
        fetchAdminProfile(userEmail);
      }
    }
  }, []);

  const fetchTeacherProfile = async (email: string) => {
    setIsLoading(true);
    try {
      // Step 1: Search for teacher by email
      const searchResults = await searchTeacherByEmail(email);
      
      // Handle search response - could be array or object with data property
      const teachersArray = Array.isArray(searchResults) ? searchResults : (searchResults.data || []);
      
      if (teachersArray && teachersArray.length > 0) {
        const teacherSummary = teachersArray[0];
        const osid = teacherSummary.osid;
        localStorage.setItem("teacherOsid", osid);
        
        // Step 2: Get full teacher details by osid
        const teacherDetails: TeacherProfile = await getTeacherById(osid);
        
        // Step 3: Populate form data
        setFormData({
          fullName: teacherDetails.name || "",
          gender: teacherDetails.gender || "Male",
          mobile: teacherDetails.mobile || "",
          email: teacherDetails.email || "",
          instituteName: teacherDetails.instituteName || "",
          dob: teacherDetails.osCreatedAt ? format(new Date(teacherDetails.osCreatedAt), "yyyy-MM-dd") : "",
          degree: "",
          grade: "",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Failed to load profile",
        description: error instanceof Error ? error.message : "Could not fetch teacher profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentProfile = async (email: string) => {
    setIsLoading(true);
    try {
      const searchResults = await searchStudentByEmail(email);
      
      // Handle search response - could be array or object with data property
      const studentsArray = Array.isArray(searchResults) ? searchResults : (searchResults.data || []);
      
      if (studentsArray && studentsArray.length > 0) {
        const studentSummary = studentsArray[0];
        const osid = studentSummary.osid;
        setStudentId(osid);
        localStorage.setItem("studentOsid", osid);
        
        const studentDetails: StudentProfile = await getStudentById(osid);
        
        const studentFormData = {
          fullName: studentDetails.fullName || "",
          gender: studentDetails.gender || "Male",
          mobile: studentDetails.mobile || "",
          email: studentDetails.email || "",
          instituteName: studentDetails.instituteName || "",
          dob: studentDetails.dob || "",
          degree: studentDetails.degree || "",
          grade: studentDetails.grade || "",
        };
        setFormData(studentFormData);
        // Store original attestable data
        setOriginalAttestableData({
          fullName: studentDetails.fullName || "",
          degree: studentDetails.degree || "",
          grade: studentDetails.grade || "",
          instituteName: studentDetails.instituteName || "",
        });

        // Fetch claims for student
        const attestations = studentDetails.studentInstituteAttest || [];
        const claimsData = attestations.map((attest: any) => {
          let parsedData: any = {};
          try {
            parsedData = JSON.parse(attest.propertyData || '{}');
          } catch (e) {
            console.error('Failed to parse propertyData:', e);
          }

          return {
            id: attest.osid || attest._osClaimId,
            attestationId: attest.osid || attest._osClaimId,
            instituteName: parsedData.instituteName || studentDetails.instituteName || "",
            studentName: parsedData.fullName || studentDetails.fullName || "",
            fields: attest.fields || [],
            dateRequested: attest.osCreatedAt ? (attest.osCreatedAt.includes('T') ? attest.osCreatedAt : `${attest.osCreatedAt}:00.000Z`) : new Date().toISOString(),
            dateApproved: attest._osState === "PUBLISHED" ? attest.osUpdatedAt : undefined,
            status: attest._osState === "PUBLISHED" ? "approved" : "pending",
            propertyData: attest.propertyData || "",
            _osState: attest._osState || "",
          };
        });
        setClaims(claimsData);

        // Check for pending claims (ATTESTATION_REQUESTED status)
        const pending = attestations.some((attest: any) => attest._osState === "ATTESTATION_REQUESTED");
        setHasPendingClaims(pending);
        
        // Check for published attestations
        const hasPublished = attestations.some((attest: any) => attest._osState === "PUBLISHED");
        setHasPublishedAttestation(hasPublished);
      }
    } catch (error) {
      toast({
        title: "❌ Failed to load profile",
        description: error instanceof Error ? error.message : "Could not fetch student profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminProfile = async (email: string) => {
    setIsLoading(true);
    try {
      const searchResults = await searchAdminByEmail(email);
      
      // Handle search response - could be array or object with data property
      const adminsArray = Array.isArray(searchResults) ? searchResults : (searchResults.data || []);
      
      if (adminsArray && adminsArray.length > 0) {
        const adminSummary = adminsArray[0];
        const osid = adminSummary.osid;
        
        const adminDetails = await getAdminById(osid);
        
        setFormData({
          fullName: adminDetails.name || "",
          gender: adminDetails.gender || "Male",
          mobile: adminDetails.mobile || "",
          email: adminDetails.email || "",
          instituteName: adminDetails.instituteName || "",
          dob: adminDetails.osCreatedAt ? format(new Date(adminDetails.osCreatedAt), "yyyy-MM-dd") : "",
          degree: "",
          grade: "",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Failed to load profile",
        description: error instanceof Error ? error.message : "Could not fetch admin profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get role display name
  const getRoleDisplay = (role: string) => {
    if (role === "admin") return t("login.admin");
    if (role === "teacher") return t("login.teacher");
    if (role === "student") return t("login.student");
    return t("login.admin");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.dob) newErrors.dob = "Date of Birth is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.fullName) newErrors.fullName = "Full Name is required";
    if (!formData.mobile) newErrors.mobile = "Mobile number is required";
    if (!formData.email) newErrors.email = "Email ID is required";
    if (!formData.instituteName) newErrors.instituteName = "Institute Name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSaving(true);
      
      try {
        if (userRole === "student" && studentId) {
          // Update student profile
          await updateStudent(studentId, {
            fullName: formData.fullName,
            gender: formData.gender,
            mobile: formData.mobile,
            email: formData.email,
            instituteName: formData.instituteName,
            dob: formData.dob,
            degree: formData.degree,
            grade: formData.grade,
          });

          // Check if attestable fields changed (fullName, degree, grade auto-trigger claims)
          const changedFields: string[] = [];
          if (formData.fullName !== originalAttestableData.fullName) changedFields.push("fullName");
          if (formData.degree !== originalAttestableData.degree) changedFields.push("degree");
          if (formData.grade !== originalAttestableData.grade) changedFields.push("grade");

          if (changedFields.length > 0) {
            // Request attestation for changed degree/grade fields
            try {
              await attestFieldClaim(studentId, changedFields);
              toast({
                title: "✅ Profile updated with attestation request",
                description: "You have changed attestable data, so a claim is raised. You can download the certificate after verification.",
                variant: "default",
              });
              // Refresh profile to update claims list
              const userEmail = localStorage.getItem("userEmail");
              if (userEmail) {
                await fetchStudentProfile(userEmail);
              }
              setIsEditMode(false); // Exit edit mode after successful save
            } catch (error) {
              toast({
                title: "✅ Profile updated successfully",
                description: "Your profile has been saved. (Attestation request failed)",
                variant: "success",
              });
            }
          } else {
            toast({
              title: "✅ Profile updated successfully",
              description: "Your profile has been saved.",
              variant: "success",
            });
          }
          
          // Refresh claims list
          const userEmail = localStorage.getItem("userEmail") || "";
          await fetchStudentProfile(userEmail);
          setIsEditMode(false); // Exit edit mode after successful save
        } else if (userRole === "teacher") {
          // Update teacher profile
          const teacherOsid = localStorage.getItem("teacherOsid") || "";
          if (teacherOsid) {
            await updateTeacher(teacherOsid, {
              name: formData.fullName,
              gender: formData.gender,
              mobile: formData.mobile,
              email: formData.email,
              instituteName: formData.instituteName,
            });
            toast({
              title: "✅ Profile updated successfully",
              description: "Your profile has been saved.",
              variant: "success",
            });
          }
        } else {
          // For admin, just show success message
          toast({
            title: "✅ Profile updated successfully",
            description: "Your profile has been saved.",
            variant: "success",
          });
        }
        
        // No navigation - stay on profile page
      } catch (error) {
        toast({
          title: "❌ Failed to update profile",
          description: error instanceof Error ? error.message : "Could not save profile",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    // Reload profile data to reset form
    const userEmail = localStorage.getItem("userEmail");
    const role = localStorage.getItem("userRole") || "admin";
    if (userEmail) {
      if (role === "student") {
        fetchStudentProfile(userEmail);
        setIsEditMode(false); // Exit edit mode
      } else if (role === "teacher") {
        fetchTeacherProfile(userEmail);
      } else {
        fetchAdminProfile(userEmail);
      }
    }
  };

  const handleRaiseClaim = async () => {
    if (!isStudent || !studentId) return;
    
    setIsSaving(true);
    try {
      // Raise attestation for all attestable fields (fullName, degree, grade, instituteName)
      const attestableFields = ["fullName", "degree", "grade", "instituteName"];
      await attestFieldClaim(studentId, attestableFields);
      
      toast({
        title: "✅ Attestation claim raised",
        description: "Your attestation request has been submitted for verification.",
        variant: "default",
      });
      
      // Refresh profile to update claims
      const userEmail = localStorage.getItem("userEmail");
      if (userEmail) {
        await fetchStudentProfile(userEmail);
      }
    } catch (error) {
      console.error("Error raising attestation claim:", error);
      toast({
        title: "❌ Error",
        description: "Failed to raise attestation claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadCertificate = async (claim: any) => {
    setDownloadingId(claim.id);
    try {
      const attestationName = "studentInstituteAttest";
      const attestationId = claim.attestationId || "";
      
      if (!attestationId || !studentId) {
        throw new Error("Cannot download certificate");
      }
      
      const blob = await downloadStudentCertificate(studentId, attestationName, attestationId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${claim.instituteName.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "✅ Certificate downloaded",
        description: "Your certificate has been downloaded successfully",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "❌ Download failed",
        description: error instanceof Error ? error.message : "Could not download certificate",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const isAdmin = userRole === "admin";
  const isReadOnly = isAdmin;
  const isStudent = userRole === "student";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {isLoading ? (
          <Card className="bg-card shadow-xl border-2 border-border rounded-2xl overflow-hidden">
            <CardContent className="pt-8 px-8 pb-8">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">{t("action.loading")}</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Student View Mode */}
            {isStudent && !isEditMode ? (
              <div className="space-y-6">
                <Card className="bg-card shadow-xl border-2 border-border rounded-2xl overflow-hidden">
                  <CardContent className="pt-8 px-8 pb-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-foreground">My Profile</h2>
                        {hasPublishedAttestation && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verified
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3">
                        {!hasPendingClaims && !hasPublishedAttestation && (
                          <Button
                            type="button"
                            variant="default"
                            onClick={handleRaiseClaim}
                            disabled={isSaving}
                            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4" />
                                Get Attested
                              </>
                            )}
                          </Button>
                        )}
                        {claims.filter(c => c._osState === "PUBLISHED").length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const publishedClaim = claims.find(c => c._osState === "PUBLISHED");
                              if (publishedClaim) handleDownloadCertificate(publishedClaim);
                            }}
                            disabled={downloadingId !== null}
                            className="gap-2"
                          >
                            {downloadingId ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4" />
                                Download Certificate
                              </>
                            )}
                          </Button>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                onClick={() => setIsEditMode(true)}
                                disabled={hasPendingClaims}
                                className={`gap-2 ${hasPendingClaims ? 'cursor-not-allowed opacity-50' : ''}`}
                              >
                                <Edit2 className="h-4 w-4" />
                                Edit Profile
                              </Button>
                            </TooltipTrigger>
                            {hasPendingClaims && (
                              <TooltipContent>
                                <p>Your request is pending approval. You cannot edit your profile until it's processed.</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                          Full Name
                          <Badge variant="secondary" className="text-xs gap-1"><Shield className="h-3 w-3" />Attestable</Badge>
                        </Label>
                        <p className="mt-1 text-base font-medium text-foreground">{formData.fullName || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">Gender</Label>
                        <p className="mt-1 text-base font-medium text-foreground">{formData.gender || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">Date of Birth</Label>
                        <p className="mt-1 text-base font-medium text-foreground">
                          {formData.dob ? format(new Date(formData.dob), "PPP") : "—"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">Mobile</Label>
                        <p className="mt-1 text-base font-medium text-foreground">{formData.mobile || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                          Institute Name
                          <Badge variant="secondary" className="text-xs gap-1"><Shield className="h-3 w-3" />Attestable</Badge>
                        </Label>
                        <p className="mt-1 text-base font-medium text-foreground">{formData.instituteName || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">Email</Label>
                        <p className="mt-1 text-base font-medium text-foreground">{formData.email || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                          Degree
                          <Badge variant="secondary" className="text-xs gap-1"><Shield className="h-3 w-3" />Attestable</Badge>
                        </Label>
                        <p className="mt-1 text-base font-medium text-foreground">{formData.degree || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                          Grade
                          <Badge variant="secondary" className="text-xs gap-1"><Shield className="h-3 w-3" />Attestable</Badge>
                        </Label>
                        <p className="mt-1 text-base font-medium text-foreground">{formData.grade || "—"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Claims Table - View Mode */}
                {claims.filter(c => c._osState === "ATTESTATION_REQUESTED").length > 0 && (
                  <Card className="bg-amber-50/50 dark:bg-amber-950/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
                        <AlertCircle className="h-5 w-5" />
                        Pending Attestation Claims
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date Requested</TableHead>
                            <TableHead>Fields Changed</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {claims
                            .filter((claim) => claim._osState === "ATTESTATION_REQUESTED")
                            .map((claim) => (
                              <TableRow key={claim.id}>
                                <TableCell>
                                  {claim.dateRequested ? format(new Date(claim.dateRequested), "yyyy-MM-dd HH:mm") : "N/A"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {claim.fields && claim.fields.length > 0 ? (
                                      claim.fields.map((field: string) => (
                                        <Badge key={field} variant="outline" className="text-xs">
                                          {field}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-sm text-muted-foreground">All fields</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    Pending Approval
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Older Attestations Table - View Mode */}
                {claims.filter(c => c._osState === "PUBLISHED").length > 0 && (
                  <Card className="bg-green-50/50 dark:bg-green-950/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-500">
                        <Shield className="h-5 w-5" />
                        Attestation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date Approved</TableHead>
                            <TableHead>Fields Attested</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {claims
                            .filter((claim) => claim._osState === "PUBLISHED")
                            .map((claim) => (
                              <TableRow key={claim.id}>
                                <TableCell>
                                  {claim.dateApproved
                                    ? formatDistanceToNow(new Date(claim.dateApproved), { addSuffix: true })
                                    : "N/A"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {claim.fields && claim.fields.length > 0 ? (
                                      claim.fields.map((field: string) => (
                                        <Badge key={field} variant="outline" className="text-xs">
                                          {field}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-sm text-muted-foreground">All fields</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                    Approved
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              /* Edit Mode Form - Students & Teachers/Admins */
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-card shadow-xl border-2 border-border rounded-2xl overflow-hidden">
              <CardContent className="pt-8 px-8 pb-8 space-y-6">{isStudent && (
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-foreground">Edit Profile</h2>
                  </div>
                )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField>
                  <Label htmlFor="fullName" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {t("form.full_name")} {!isReadOnly && <span className="text-destructive">*</span>}
                    {isStudent && <Badge variant="secondary" className="text-xs gap-1"><Shield className="h-3 w-3" />Attestable</Badge>}
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`rounded-lg h-11 font-medium ${isReadOnly ? "bg-muted/50 text-foreground cursor-not-allowed" : ""} ${errors.fullName ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                    placeholder={t("form.enter_full_name")}
                    disabled={isReadOnly}
                  />
                  {errors.fullName && <p className="text-sm font-medium text-destructive">{errors.fullName}</p>}
                </FormField>
                <FormField>
                  <Label htmlFor="gender" className="text-sm font-semibold text-foreground">
                    {t("form.gender")} {!isReadOnly && <span className="text-destructive">*</span>}
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className={`rounded-lg h-11 font-medium ${isReadOnly ? "bg-muted/50 text-foreground cursor-not-allowed" : ""} ${errors.gender ? "border-destructive ring-2 ring-destructive/20" : ""}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="Male">{t("form.male")}</SelectItem>
                      <SelectItem value="Female">{t("form.female")}</SelectItem>
                      <SelectItem value="Other">{t("form.other")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-sm font-medium text-destructive">{errors.gender}</p>}
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField>
                  <Label className="text-sm font-semibold text-foreground">
                    {t("form.date_of_birth")} {!isReadOnly && <span className="text-destructive">*</span>}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={isReadOnly}
                        className={cn(
                          "w-full justify-start text-left font-medium rounded-lg h-11",
                          isReadOnly && "bg-muted/50 text-foreground cursor-not-allowed",
                          !formData.dob && "text-muted-foreground",
                          errors.dob ? "border-destructive ring-2 ring-destructive/20" : ""
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dob ? format(new Date(formData.dob), "PPP") : t("form.pick_date")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dob ? new Date(formData.dob) : undefined}
                        onSelect={(date) => setFormData({ ...formData, dob: date ? format(date, "yyyy-MM-dd") : "" })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.dob && <p className="text-sm font-medium text-destructive">{errors.dob}</p>}
                </FormField>
                <FormField>
                  <Label htmlFor="mobile" className="text-sm font-semibold text-foreground">
                    {t("form.mobile")} {!isReadOnly && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className={`rounded-lg h-11 font-medium ${isReadOnly ? "bg-muted/50 text-foreground cursor-not-allowed" : ""} ${errors.mobile ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                    placeholder={t("form.enter_mobile")}
                    disabled={isReadOnly}
                  />
                  {errors.mobile && <p className="text-sm font-medium text-destructive">{errors.mobile}</p>}
                </FormField>
              </div>

              {!isAdmin && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField>
                      <Label htmlFor="instituteName" className="text-sm font-semibold text-foreground flex items-center gap-2">
                        {t("form.institute_name")} <span className="text-destructive">*</span>
                        {isStudent && <Badge variant="secondary" className="text-xs gap-1"><Shield className="h-3 w-3" />Attestable</Badge>}
                      </Label>
                      {isStudent ? (
                        <Input
                          id="instituteName"
                          value={formData.instituteName}
                          onChange={(e) => setFormData({ ...formData, instituteName: e.target.value })}
                          className={`rounded-lg h-11 font-medium bg-muted/50 text-foreground cursor-not-allowed ${errors.instituteName ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                          placeholder={t("form.enter_institute")}
                          disabled={true}
                        />
                      ) : (
                        <Select
                          value={formData.instituteName}
                          onValueChange={(value) => setFormData({ ...formData, instituteName: value })}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger className={`rounded-lg h-11 font-medium ${isReadOnly ? "bg-muted/50 cursor-not-allowed" : ""} ${errors.instituteName ? "border-destructive ring-2 ring-destructive/20" : ""}`}>
                            <SelectValue placeholder={t("form.select_institute")} />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            <SelectItem value="IIT Delhi">IIT Delhi</SelectItem>
                            <SelectItem value="IIT Bombay">IIT Bombay</SelectItem>
                            <SelectItem value="NIT Trichy">NIT Trichy</SelectItem>
                            <SelectItem value="Delhi University">Delhi University</SelectItem>
                            <SelectItem value="Anna University">Anna University</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {errors.instituteName && <p className="text-sm font-medium text-destructive">{errors.instituteName}</p>}
                    </FormField>
                    <FormField>
                      <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                        {t("form.email")} {!isReadOnly && <span className="text-destructive">*</span>}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`rounded-lg h-11 font-medium ${isReadOnly ? "bg-muted/50 text-foreground cursor-not-allowed" : ""} ${errors.email ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                        placeholder={t("form.enter_email")}
                        disabled={isReadOnly}
                      />
                      {errors.email && <p className="text-sm font-medium text-destructive">{errors.email}</p>}
                    </FormField>
                  </div>

                  {/* Degree and Grade fields - only for students */}
                  {isStudent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField>
                        <Label htmlFor="degree" className="text-sm font-semibold text-foreground flex items-center gap-2">
                          {t("form.degree")}
                          <Badge variant="secondary" className="text-xs gap-1"><Shield className="h-3 w-3" />Attestable</Badge>
                        </Label>
                        <Select
                          value={formData.degree}
                          onValueChange={(value) => setFormData({ ...formData, degree: value })}
                          disabled={hasPendingClaims || isReadOnly}
                        >
                          <SelectTrigger className={`rounded-lg h-11 font-medium ${hasPendingClaims || isReadOnly ? "bg-muted/50 cursor-not-allowed" : ""}`}>
                            <SelectValue placeholder={t("form.select_degree")} />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            <SelectItem value="B.Tech">B.Tech</SelectItem>
                            <SelectItem value="M.Tech">M.Tech</SelectItem>
                            <SelectItem value="B.Sc">B.Sc</SelectItem>
                            <SelectItem value="M.Sc">M.Sc</SelectItem>
                            <SelectItem value="MBA">MBA</SelectItem>
                            <SelectItem value="PhD">PhD</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                      <FormField>
                        <Label htmlFor="grade" className="text-sm font-semibold text-foreground flex items-center gap-2">
                          {t("form.grade")}
                          <Badge variant="secondary" className="text-xs gap-1"><Shield className="h-3 w-3" />Attestable</Badge>
                        </Label>
                        <Input
                          id="grade"
                          value={formData.grade}
                          onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                          className={`rounded-lg h-11 font-medium ${hasPendingClaims || isReadOnly ? "bg-muted/50 cursor-not-allowed" : ""}`}
                          placeholder={t("form.enter_grade")}
                          disabled={hasPendingClaims || isReadOnly}
                        />
                      </FormField>
                    </div>
                  )}
                </>
              )}

              {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField>
                    <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                      Email ID {!isReadOnly && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`rounded-lg h-11 font-medium ${isReadOnly ? "bg-muted/50 text-foreground cursor-not-allowed" : ""} ${errors.email ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                      placeholder="email@example.com"
                      disabled={isReadOnly}
                    />
                    {errors.email && <p className="text-sm font-medium text-destructive">{errors.email}</p>}
                  </FormField>
                </div>
              )}

              {/* Save/Cancel Buttons for Students - Inside Card */}
              {isStudent && !isReadOnly && (!hasPendingClaims) && (
                <div className="flex justify-end gap-4 pt-4 border-t border-border mt-6">
                  <Button type="button" variant="outline" onClick={handleCancel} className="rounded-lg px-6" disabled={isSaving}>
                    {t("btn.cancel")}
                  </Button>
                  <Button type="submit" className="rounded-lg px-8 bg-primary hover:bg-primary/90 gap-2" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {t("btn.save_changes")}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save/Cancel Buttons for Teachers - Outside Card */}
          {!isReadOnly && !isStudent && (
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={handleCancel} className="rounded-lg px-6" disabled={isSaving}>
                {t("btn.cancel")}
              </Button>
              <Button type="submit" className="rounded-lg px-8 bg-primary hover:bg-primary/90 gap-2" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {t("btn.save_changes")}
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewProfile;
