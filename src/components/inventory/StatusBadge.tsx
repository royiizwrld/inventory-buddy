import { cn } from "@/lib/utils";
import { STATUS_LABEL } from "@/lib/inventory";
import type { StockStatus } from "@/lib/types";

const styles: Record<StockStatus, string> = {
  in: "bg-success/15 text-success border-success/30",
  low: "bg-warning/20 text-warning-foreground border-warning/50 dark:text-warning",
  out: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status, className }: { status: StockStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium", styles[status], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}
