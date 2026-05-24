import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { useState, useRef, useEffect } from "react";
import { Play, Loader2, Square, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThroughput, useTimeseries } from "@/hooks/use-metrics";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";

export const Route = createFileRoute("/load-testing")({
  component: LoadTesting,
});

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  fontSize: "12px",
  fontFamily: "var(--font-mono)",
};

interface TimeseriesPoint {
  t: string;
  no_index: number;
  no_index_rps: number;
  single_index: number;
  single_index_rps: number;
  compound_index: number;
  compound_index_rps: number;
}

function LoadTesting() {
  const [rps, setRps] = useState(500);
  const [duration, setDuration] = useState("60s");
  const [vus, setVus] = useState("20");
  const [logs, setLogs] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [testStart, setTestStart] = useState<number | undefined>(undefined);
  
  const { data: throughput } = useThroughput();
  const durationNum = parseInt(duration.replace("s", ""));
  const { data: timeseries } = useTimeseries(testStart, durationNum);
  const consoleRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  const handleStart = () => {
    const now = Date.now();
    setLogs("Démarrage du conteneur k6...\n");
    setIsRunning(true);
    setTestStart(now);
    
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
    const eventSource = new EventSource(`${API_URL}/benchmark/run?duration=${duration}&vus=${vus}`);

    eventSource.onmessage = (event) => {
      if (event.data.startsWith("[DONE]")) {
        eventSource.close();
        setIsRunning(false);
      }
      setLogs((prev) => prev + event.data + "\n");
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
      setLogs((prev) => prev + "\n[ERREUR] Connexion perdue ou bloquée par CORS.\n");
      eventSource.close();
      setIsRunning(false);
    };
  };

  const currentRps = Math.round((throughput?.compound_index || 0) + (throughput?.single_index || 0) + (throughput?.no_index || 0));
  const totalRequests = throughput?.total || 0;
  const lastLatency = timeseries?.[timeseries.length - 1]?.compound_index || 0;

  const calculateAvg = (key: keyof TimeseriesPoint) => {
    const activeData = timeseries?.filter(d => (d[key] as any) > 0) || [];
    if (activeData.length === 0) return "0.00";
    const sum = activeData.reduce((acc, curr) => acc + (curr[key] as any), 0);
    return (sum / activeData.length).toFixed(2);
  };

  const precisionAvg = {
    no_index: calculateAvg("no_index"),
    single_index: calculateAvg("single_index"),
    compound_index: calculateAvg("compound_index"),
  };

  const getStatusLabel = (val: string) => {
    const num = parseFloat(val);
    if (num === 0) return "EN ATTENTE";
    if (num < 2) return "OPTIMAL";
    if (num < 10) return "ACCEPTABLE";
    return "CRITIQUE";
  };

  return (
    <>
      <PageHeader
        title="Load Testing"
        description="Génération de trafic synthétique avec k6."
        status={{ label: isRunning ? "Test en cours" : "Inactif", tone: isRunning ? "success" : "info" }}
        actions={
          <button
            onClick={handleStart}
            disabled={isRunning}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md",
              isRunning
                ? "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {isRunning ? "Test en cours..." : "Démarrer"}
          </button>
        }
      />

      <div className="console-card p-4 mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Outil</label>
          <div className="flex rounded-md border border-border overflow-hidden text-[12px] font-medium">
             <button className="px-3 py-1.5 bg-primary text-primary-foreground cursor-default">k6 (actif)</button>
          </div>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Charge cible</label>
          <div className="flex rounded-md border border-border overflow-hidden text-[12px] font-mono">
            {[50, 100, 250, 500, 1000].map((v) => (
              <button key={v} onClick={() => setRps(v)} className={cn("px-3 py-1.5 border-r border-border last:border-r-0", rps === v ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent")}>{v}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Durée</label>
          <input value={duration} onChange={(e) => setDuration(e.target.value)} className="w-24 bg-background border border-border rounded px-2 py-1.5 text-[12px] font-mono" />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">VUs</label>
          <input value={vus} onChange={(e) => setVus(e.target.value)} className="w-24 bg-background border border-border rounded px-2 py-1.5 text-[12px] font-mono" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Throughput Réel" value={currentRps.toString()} unit="req/s" delta={{ value: isRunning ? "Test" : "IDLE", direction: "up", positive: true }} />
        <MetricCard label="Latence p95" value={Math.round(lastLatency).toString()} unit="ms" hint="Compound Index" />
        <MetricCard label="Requêtes en base" value={totalRequests.toLocaleString()} delta={{ value: "Global", direction: "flat", positive: true }} />
        <MetricCard label="Statut Système" value={isRunning ? "Saturé" : "Repos"} hint={isRunning ? "Test en cours" : "Prêt"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <div className="console-card p-6">
          <h3 className="text-base font-semibold mb-4 text-primary font-mono uppercase tracking-tight">Throughput soutenu (req/s)</h3>
          <div className="h-[450px]">
            <ResponsiveContainer>
              <LineChart data={timeseries}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={10} interval={Math.round(durationNum / 5)} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} cursor={false} isAnimationActive={false} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-mono)", paddingTop: "20px" }} />
                <Line type="monotone" dataKey="no_index_rps" name="AUCUN INDEX" stroke="var(--chart-4)" strokeWidth={3} dot={false} isAnimationActive={true} animationDuration={1000} />
                <Line type="monotone" dataKey="single_index_rps" name="INDEX SIMPLE" stroke="var(--chart-2)" strokeWidth={3} dot={false} isAnimationActive={true} animationDuration={1000} />
                <Line type="monotone" dataKey="compound_index_rps" name="INDEX COMPOSÉ" stroke="var(--chart-3)" strokeWidth={3} dot={false} isAnimationActive={true} animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="console-card p-6">
          <h3 className="text-base font-semibold mb-4 text-primary font-mono uppercase tracking-tight">Latence du benchmark (ms)</h3>
          <div className="h-[450px]">
            <ResponsiveContainer>
              <LineChart data={timeseries}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={10} interval={Math.round(durationNum / 5)} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} unit=" ms" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={false} isAnimationActive={false} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-mono)", paddingTop: "20px" }} />
                <Line type="monotone" dataKey="no_index" name="AUCUN INDEX" stroke="var(--chart-4)" strokeWidth={3} dot={false} isAnimationActive={true} animationDuration={1000} />
                <Line type="monotone" dataKey="single_index" name="INDEX SIMPLE" stroke="var(--chart-2)" strokeWidth={3} dot={false} isAnimationActive={true} animationDuration={1000} />
                <Line type="monotone" dataKey="compound_index" name="INDEX COMPOSÉ" stroke="var(--chart-3)" strokeWidth={3} dot={false} isAnimationActive={true} animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="console-card p-6 mb-6">
        <h3 className="text-sm font-bold text-primary font-mono uppercase tracking-widest mb-6 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Analyse de précision : Latence moyenne globale
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "AUCUN INDEX", value: precisionAvg.no_index, color: "var(--chart-4)" },
            { name: "INDEX SIMPLE", value: precisionAvg.single_index, color: "var(--chart-2)" },
            { name: "INDEX COMPOSÉ", value: precisionAvg.compound_index, color: "var(--chart-3)" },
          ].map((strat) => {
            const status = getStatusLabel(strat.value);
            const statusColor = status === "CRITIQUE" ? "var(--chart-4)" : status === "OPTIMAL" ? "var(--chart-3)" : "var(--chart-2)";
            
            return (
              <div key={strat.name} className="flex flex-col border-l-2 pl-4 py-1" style={{ borderLeftColor: strat.color }}>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-1">{strat.name}</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black font-mono tabular-nums tracking-tight" style={{ color: strat.color }}>{strat.value}</span>
                  <span className="text-xs font-bold text-muted-foreground">ms</span>
                </div>
                <div className="text-[9px] font-black mt-2 tracking-widest opacity-80" style={{ color: statusColor }}>{status}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="console-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", isRunning ? "bg-success animate-pulse" : "bg-muted")} />
          <h3 className="text-sm font-semibold">Console k6 — sortie temps réel</h3>
        </div>
        <pre ref={consoleRef} className="p-4 text-[12px] font-mono leading-relaxed bg-background overflow-y-auto max-h-[400px] min-h-[200px]">
          {logs || "Cliquez sur Démarrer pour lancer le benchmark..."}
        </pre>
      </div>
    </>
  );
}
