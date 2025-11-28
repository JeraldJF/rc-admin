import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface SchemaPropertyProps {
  name: string;
  type: string;
  title?: string;
  required?: boolean;
  enum?: string[];
  format?: string;
  description?: string;
}

export const SchemaProperty = ({
  name,
  type,
  title,
  required = false,
  enum: enumValues,
  format,
  description,
}: SchemaPropertyProps) => {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <code className="text-sm font-semibold text-primary">{name}</code>
            {required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
          </div>
          {title && <p className="text-sm text-muted-foreground mb-1">{title}</p>}
        </div>
        <Badge variant="secondary" className="text-xs">
          {type}
          {format && ` (${format})`}
        </Badge>
      </div>
      
      {description && (
        <p className="text-sm text-foreground mb-2">{description}</p>
      )}
      
      {enumValues && (
        <div className="mt-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Allowed values:</p>
          <div className="flex flex-wrap gap-1">
            {enumValues.map((value) => (
              <Badge key={value} variant="outline" className="text-xs">
                {value}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
