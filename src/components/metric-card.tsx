import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  delta?: { value: string; direction: "up" | "down" | "flat"; positive?: boolean };
  hint?: string;
  className?: string;
  indicatorColor?: string;
}

export function MetricCard({ label, value, unit, delta, hint, className, indicatorColor }: MetricCardProps) {
  const Icon =
    delta?.direction === "up" ? TrendingUp : delta?.direction === "down" ? TrendingDown : Minus;
  const positive = delta?.positive ?? false;
  return (
    <div 
      className={cn("console-card p-4 border-l-4", className)}
      style={{ borderLeftColor: indicatorColor }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </span>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-mono",
              positive ? "text-success" : "text-destructive"
            )}
          >
            <Icon className="h-3 w-3" />
            {delta.value}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tracking-tight font-mono">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
