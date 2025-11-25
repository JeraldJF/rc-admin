import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Pencil, Eye } from "lucide-react";
import { getTeacherById, getStudentById } from "@/lib/api";
import { format } from "date-fns";

interface EntityData {
  name?: string;
  fullName?: string;
  email: string;
  mobile?: string;
  gender?: string;
  instituteName?: string;
  dob?: string;
  subject?: string;
}

const ViewEntity = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<EntityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("admin");

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "admin";
    setUserRole(role);
  }, []);

  useEffect(() => {
    const fetchEntity = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const role = localStorage.getItem("userRole") || "admin";
        
        if (role === "admin") {
          // Fetch teacher data
          const data = await getTeacherById(id);
          setEntity(data);
        } else {
          // Fetch student data
          const data = await getStudentById(id);
          setEntity(data);
        }
      } catch (error) {
        console.error("Failed to fetch entity:", error);
        setEntity(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEntity();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!entity) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">{t("error.entity_not_found")}</h2>
          <Button onClick={() => navigate("/registry")} className="mt-4">
            {t("btn.back_to_registry")}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="text-base font-medium text-foreground">{value || "—"}</p>
    </div>
  );

  const pageTitle = userRole === "admin" ? t("heading.view_teacher") : t("heading.view_student");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/registry")} className="gap-2 hover:bg-accent transition-colors rounded-lg">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold">{t("btn.back")}</span>
          </Button>
          <div className="h-6 w-px bg-border"></div>
          <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
        </div>

        <Card className="shadow-lg border-border rounded-xl overflow-hidden">
          <CardContent className="pt-6 bg-card">
            <div className="flex items-center justify-between gap-4 mb-6 pb-6 border-b border-border">
              <div className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">
                  {entity.fullName || entity.name}
                </h2>
              </div>
              <Button onClick={() => navigate(`/entity/${id}/edit`)} className="gap-2 font-semibold rounded-lg">
                <Pencil className="h-4 w-4" />
                {t("btn.edit")}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {userRole === "teacher" ? (
                <>
                  <InfoRow label={t("form.full_name")} value={entity.fullName} />
                  <InfoRow label={t("form.institute_name")} value={entity.instituteName} />
                  <InfoRow label={t("form.date_of_birth")} value={entity.dob ? format(new Date(entity.dob), "PPP") : undefined} />
                  <InfoRow label={t("form.gender")} value={entity.gender} />
                  <InfoRow label={t("form.mobile")} value={entity.mobile} />
                  <InfoRow label={t("form.email")} value={entity.email} />
                </>
              ) : (
                <>
                  <InfoRow label={t("form.name")} value={entity.name} />
                  <InfoRow label={t("form.gender")} value={entity.gender} />
                  <InfoRow label={t("form.mobile")} value={entity.mobile} />
                  <InfoRow label={t("form.email")} value={entity.email} />
                  <InfoRow label={t("form.institute_name")} value={entity.instituteName} />
                  <InfoRow label={t("form.subject")} value={entity.subject} />
                  <InfoRow label={t("form.date_of_birth")} value={entity.dob ? format(new Date(entity.dob), "PPP") : undefined} />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ViewEntity;
