import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface StatusBadgeProps {
  status: string;
  pulse?: boolean;
  className?: string;
}

// Enhanced semantic color treatments with better distinction and visual appeal
const statusClasses: Record<string, string> = {
  approved: "bg-gradient-to-r from-green-50 to-green-100/80 text-green-800 border border-green-300 shadow-green-100/50 shadow-md dark:from-green-900/40 dark:to-green-800/30 dark:text-green-200 dark:border-green-600/70",
  pending: "bg-gradient-to-r from-amber-50 to-yellow-100/80 text-amber-800 border border-amber-300 shadow-amber-100/50 shadow-md dark:from-amber-900/40 dark:to-amber-800/30 dark:text-amber-200 dark:border-amber-600/70",
  rejected: "bg-gradient-to-r from-red-50 to-red-100/80 text-red-800 border border-red-300 shadow-red-100/50 shadow-md dark:from-red-900/40 dark:to-red-800/30 dark:text-red-200 dark:border-red-600/70",
  open: "bg-gradient-to-r from-amber-50 to-yellow-100/80 text-amber-800 border border-amber-300 shadow-amber-100/50 shadow-md dark:from-amber-900/40 dark:to-amber-800/30 dark:text-amber-200 dark:border-amber-600/70",
  closed: "bg-gradient-to-r from-green-50 to-green-100/80 text-green-800 border border-green-300 shadow-green-100/50 shadow-md dark:from-green-900/40 dark:to-green-800/30 dark:text-green-200 dark:border-green-600/70",
};

const statusIcons: Record<string, JSX.Element> = {
  approved: <CheckCircle2 className="h-3.5 w-3.5" />,
  closed: <CheckCircle2 className="h-3.5 w-3.5" />,
  pending: <Clock className="h-3.5 w-3.5" />,
  open: <Clock className="h-3.5 w-3.5" />,
  rejected: <XCircle className="h-3.5 w-3.5" />,
};

export const StatusBadge = ({ status, pulse, className }: StatusBadgeProps) => {
  const { t } = useLanguage();
  const normalized = status?.toLowerCase() || "";
  const classes = statusClasses[normalized] || "bg-muted text-muted-foreground border border-border";
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
      case 'closed':
        return t("status.approved");
      case 'pending':
      case 'open':
        return t("status.pending");
      case 'rejected':
        return t("status.rejected");
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  return (
    <span
      aria-label={`Status: ${normalized}`}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide backdrop-blur-sm ring-1 ring-white/20 transition-all duration-200 hover:scale-105",
        classes,
        // Removed pulse animation as requested
        className
      )}
    >
      {statusIcons[normalized] && (
        <span className="flex items-center justify-center">{statusIcons[normalized]}</span>
      )}
      <span>{getStatusText(normalized)}</span>
    </span>
  );
};

export default StatusBadge;