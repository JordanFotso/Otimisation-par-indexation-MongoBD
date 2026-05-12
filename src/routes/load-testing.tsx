import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { THROUGHPUT, TIMESERIES } from "@/lib/mock-data";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useState } from "react";
import { Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";

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

function LoadTesting() {
  const [running, setRunning] = useState(true);
  const [tool, setTool] = useState<"hey" | "k6">("k6");
  const [rps, setRps] = useState(500);

  return (
    <>
      <PageHeader
        title="Load Testing"
        description="Génération de trafic synthétique avec Hey/k6. Trois cibles parallèles, chacune branchée sur une collection avec une stratégie d'index distincte."
        status={{ label: running ? "Test en cours" : "Inactif", tone: running ? "success" : "info" }}
        actions={
          <button
            onClick={() => setRunning((r) => !r)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md",
              running
                ? "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {running ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {running ? "Arrêter" : "Démarrer"}
          </button>
        }
      />

      {/* Config bar */}
      <div className="console-card p-4 mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Outil</label>
          <div className="flex rounded-md border border-border overflow-hidden text-[12px] font-medium">
            {(["k6", "hey"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTool(t)}
                className={cn(
                  "px-3 py-1.5",
                  tool === t ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Charge cible</label>
          <div className="flex rounded-md border border-border overflow-hidden text-[12px] font-mono">
            {[50, 100, 250, 500, 1000].map((v) => (
              <button
                key={v}
                onClick={() => setRps(v)}
                className={cn(
                  "px-3 py-1.5 border-r border-border last:border-r-0",
                  rps === v ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Durée</label>
          <input
            defaultValue="60s"
            className="w-24 bg-background border border-border rounded px-2 py-1.5 text-[12px] font-mono"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">VUs</label>
          <input
            defaultValue="200"
            className="w-24 bg-background border border-border rounded px-2 py-1.5 text-[12px] font-mono"
          />
        </div>
        <div className="ml-auto text-[11px] font-mono text-muted-foreground">
          $ {tool} run --vus 200 --duration 60s --rps {rps} ./bench.{tool === "k6" ? "js" : "sh"}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <MetricCard label="Requêtes envoyées" value="29 412" delta={{ value: "+1.2k/s", direction: "up", positive: true }} />
        <MetricCard label="Erreurs" value="0.04" unit="%" delta={{ value: "-0.1 %", direction: "down", positive: true }} />
        <MetricCard label="Latence p95" value="14" unit="ms" hint="compound_index" />
        <MetricCard label="Saturation" value="73" unit="%" hint="no_index — saturé" delta={{ value: "+12 %", direction: "up", positive: false }} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <div className="console-card p-4">
          <h3 className="text-sm font-semibold mb-3">Throughput soutenu (req/s)</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={THROUGHPUT}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="rps" stroke="var(--muted-foreground)" fontSize={11} unit=" rps" />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                <Line type="monotone" dataKey="no_index" stroke="var(--chart-4)" strokeWidth={2} />
                <Line type="monotone" dataKey="single_index" stroke="var(--chart-2)" strokeWidth={2} />
                <Line type="monotone" dataKey="compound_index" stroke="var(--chart-3)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="console-card p-4">
          <h3 className="text-sm font-semibold mb-3">Latence sur 30s (ms)</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={TIMESERIES}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={11} unit="s" />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} unit="ms" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="no_index" stroke="var(--chart-4)" fill="url(#g1)" />
                <Area type="monotone" dataKey="compound_index" stroke="var(--chart-3)" fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="console-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <h3 className="text-sm font-semibold">Console k6 — sortie temps réel</h3>
        </div>
        <pre className="p-4 text-[12px] font-mono leading-relaxed bg-background overflow-x-auto">
{`     execution: local
        script: bench.js
       output: -
     scenarios: (100.00%) 1 scenario, 200 max VUs, 1m30s max duration

     ✓ status is 200
     checks.........................: 99.96% ✓ 29401 ✗ 11
     data_received..................: 38 MB  632 kB/s
     http_req_duration..............: avg=12.4ms  min=1ms med=8ms  max=156ms p(95)=42ms p(99)=88ms
       { collection:no_index }......: avg=1.82s   p(95)=3.21s p(99)=4.87s
       { collection:single_index }..: avg=18ms    p(95)=42ms  p(99)=88ms
       { collection:compound_index }: avg=6ms     p(95)=14ms  p(99)=28ms
     iterations.....................: 29412   490.2/s
     vus............................: 200    min=200  max=200`}
        </pre>
      </div>
    </>
  );
}
