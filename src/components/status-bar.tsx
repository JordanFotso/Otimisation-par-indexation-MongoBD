import { useApiStatus } from "@/hooks/use-api-status";
import { useThroughput } from "@/hooks/use-metrics";
import { cn } from "@/lib/utils";
import { Wifi, Database, Activity, Zap } from "lucide-react";

export function StatusBar() {
  const { data: status } = useApiStatus();
  const { data: throughput } = useThroughput();

  const isOnline = status?.status === "online";
  const isDbConnected = status?.database === "Connected";
  const totalRps = Math.round((throughput?.compound_index || 0) + (throughput?.single_index || 0) + (throughput?.no_index || 0));

  return (
    <div className="fixed bottom-0 left-0 right-0 h-7 bg-card border-t border-border z-50 px-4 flex items-center justify-between text-[11px] font-mono select-none">
      <div className="flex items-center gap-4">
        {/* API Status */}
        <div className="flex items-center gap-1.5">
          <Wifi className={cn("h-3 w-3", isOnline ? "text-success" : "text-destructive")} />
          <span className="text-muted-foreground uppercase tracking-tighter">API:</span>
          <span className={cn("font-bold", isOnline ? "text-success" : "text-destructive")}>
            {isOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </div>

        <div className="h-3 w-px bg-border" />

        {/* DB Status */}
        <div className="flex items-center gap-1.5">
          <Database className={cn("h-3 w-3", isDbConnected ? "text-success" : "text-destructive")} />
          <span className="text-muted-foreground uppercase tracking-tighter">MONGO:</span>
          <span className={cn("font-bold", isDbConnected ? "text-success" : "text-destructive")}>
            {isDbConnected ? "CONNECTED" : "DISCONNECTED"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Real-time Throughput */}
        <div className="flex items-center gap-1.5">
          <Activity className={cn("h-3 w-3", totalRps > 0 ? "text-primary animate-pulse" : "text-muted-foreground")} />
          <span className="text-muted-foreground uppercase tracking-tighter">THROUGHPUT:</span>
          <span className="font-bold text-primary">
            {totalRps} <span className="text-[9px]">REQ/S</span>
          </span>
        </div>

        <div className="h-3 w-px bg-border" />

        {/* Live Indicator */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 leading-none h-4">
            <Zap className="h-2.5 w-2.5 fill-current" />
            <span className="font-black text-[9px]">LIVE</span>
          </div>
          <span className="text-muted-foreground opacity-50">v1.0.4-stable</span>
        </div>
      </div>
    </div>
  );
}
