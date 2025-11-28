import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Shield } from "lucide-react";

interface InfoCardProps {
  title: string;
  description?: string;
  variant?: "info" | "warning" | "success" | "security";
  children?: React.ReactNode;
}

export const InfoCard = ({ title, description, variant = "info", children }: InfoCardProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "warning":
        return "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800";
      case "success":
        return "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800";
      case "security":
        return "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800";
      default:
        return "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800";
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case "warning":
        return "text-amber-600 dark:text-amber-400";
      case "success":
        return "text-green-600 dark:text-green-400";
      case "security":
        return "text-purple-600 dark:text-purple-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  const Icon = variant === "security" ? Shield : AlertCircle;

  return (
    <Card className={`${getVariantStyles()} border-2`}>
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${getIconColor()}`} />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            {children && <div className="mt-2">{children}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
