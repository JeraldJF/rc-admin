import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Pencil, Eye } from "lucide-react";
import { mockEntities, Entity } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ViewEntity = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const found = mockEntities.find((e) => e.id === id);
      setEntity(found || null);
      setLoading(false);
    }, 300);
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
          <h2 className="text-2xl font-bold">Entity not found</h2>
          <Button onClick={() => navigate("/registry")} className="mt-4">
            Back to Registry
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/registry")} className="gap-2 hover:bg-accent transition-colors rounded-lg">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold">Back</span>
          </Button>
          <div className="h-6 w-px bg-border"></div>
          <h1 className="text-2xl font-bold text-foreground">View Entity</h1>
        </div>

        <Card className="shadow-lg border-border rounded-xl overflow-hidden">
          <CardContent className="pt-6 bg-card">
            <div className="flex items-center justify-between gap-4 mb-6 pb-6 border-b border-border">
              <div className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">
                  {entity.schema === "Student" ? entity.fullName : entity.name}
                </h2>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-sm font-semibold px-3 py-1 border-2",
                    entity.schema === "Student"
                      ? "border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30"
                      : "border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
                  )}
                >
                  {entity.schema}
                </Badge>
              </div>
              <Button onClick={() => navigate(`/entity/${id}/edit`)} className="gap-2 font-semibold rounded-lg">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {entity.schema === "Student" ? (
                <>
                  <InfoRow label="Full Name" value={entity.fullName} />
                  <InfoRow label="Institute Name" value={entity.instituteName} />
                  <InfoRow label="Date of Birth" value={entity.dob} />
                  <InfoRow label="Gender" value={entity.gender} />
                  <InfoRow label="Mobile number" value={entity.mobile} />
                  <InfoRow label="Email ID" value={entity.email} />
                  <InfoRow label="Created" value={new Date(entity.created).toLocaleString()} />
                  <InfoRow label="Updated" value={new Date(entity.updated).toLocaleString()} />
                </>
              ) : (
                <>
                  <InfoRow label="Name" value={entity.name} />
                  <InfoRow label="Gender" value={entity.gender} />
                  <InfoRow label="Mobile" value={entity.mobile} />
                  <InfoRow label="Email" value={entity.email} />
                  <InfoRow label="Subject" value={entity.subject} />
                  <InfoRow label="Institute Name" value={entity.instituteName} />
                  <InfoRow label="Date of Birth" value={entity.dob} />
                  <InfoRow label="Created" value={new Date(entity.created).toLocaleString()} />
                  <InfoRow label="Updated" value={new Date(entity.updated).toLocaleString()} />
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
