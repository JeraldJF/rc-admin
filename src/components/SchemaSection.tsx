import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SchemaSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const SchemaSection = ({ title, description, children }: SchemaSectionProps) => {
  return (
    <div className="space-y-6">
      <Card className="bg-card border-2 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
          {description && (
            <CardDescription className="text-muted-foreground">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </div>
  );
};
