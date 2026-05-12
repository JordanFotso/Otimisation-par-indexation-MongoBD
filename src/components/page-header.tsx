import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  status?: { label: string; tone?: "info" | "success" | "warning" | "critical" };
  actions?: React.ReactNode;
}

const TONES: Record<string, string> = {
  info: "bg-info/15 text-info border-info/30",
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  critical: "bg-destructive/15 text-destructive border-destructive/30",
};

export function PageHeader({ title, description, status, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-border mb-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
          {status && (
            <span
              className={cn(
                "console-chip border",
                TONES[status.tone ?? "info"]
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {status.label}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[13px] text-muted-foreground mt-1 max-w-3xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
