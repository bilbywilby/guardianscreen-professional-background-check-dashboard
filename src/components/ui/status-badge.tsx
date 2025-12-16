import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertTriangle, Hourglass } from "lucide-react";
import type { CheckStatus } from "@shared/types";
const statusConfig = {
  Clear: {
    label: "Clear",
    icon: CheckCircle,
    className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400",
  },
  Hit: {
    label: "Hit",
    icon: XCircle,
    className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400",
  },
  Pending: {
    label: "Pending",
    icon: Hourglass,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 animate-pulse",
  },
  Error: {
    label: "Error",
    icon: AlertTriangle,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  },
};
interface StatusBadgeProps {
  status: CheckStatus;
  className?: string;
}
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.Error;
  const Icon = config.icon;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </div>
  );
}