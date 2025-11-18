import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Pencil, Eye } from "lucide-react";
import { mockEntities, Entity } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-base text-foreground">{value || "—"}</p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/registry")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Entity Details</h1>
              <p className="text-muted-foreground">Viewing {entity.schema} entity</p>
            </div>
          </div>
          <Button onClick={() => navigate(`/entity/${id}/edit`)} className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
              <Eye className="h-6 w-6 text-muted-foreground" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">
                  {entity.name_english} {entity.name_khmer}
                </h2>
              </div>
              <Badge variant="outline" className="text-base">
                {entity.schema}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <InfoRow label="Name (English)" value={entity.name_english} />
              <InfoRow label="Name (Khmer)" value={entity.name_khmer} />
              <InfoRow label="Father Name" value={entity.father_name} />
              <InfoRow label="Mother Name" value={entity.mother_name} />
              <InfoRow label="Date of Birth" value={entity.dob} />
              <InfoRow label="Gender" value={entity.gender} />
              <InfoRow label="Province" value={entity.province} />
              <InfoRow label="District" value={entity.district} />
              <InfoRow label="Commune" value={entity.commune} />
              <InfoRow label="Village" value={entity.village} />
              <InfoRow label="Created" value={new Date(entity.created).toLocaleString()} />
              <InfoRow label="Updated" value={new Date(entity.updated).toLocaleString()} />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ViewEntity;
