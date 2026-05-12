import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Database,
  Zap,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { COLLECTIONS, TIMESERIES, RESPONSE_TIME } from "@/lib/mock-data";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export const Route = createFileRoute("/")({
  component: Overview,
});

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  fontSize: "12px",
  fontFamily: "var(--font-mono)",
};

function Overview() {
  return (
    <>
      <PageHeader
        title="Vue d'ensemble"
        description="Comparaison en temps réel des trois stratégies d'indexation sur 5 millions de documents. Recherche utilisateur par email sous charge soutenue."
        status={{ label: "Benchmark actif", tone: "success" }}
        actions={
          <>
            <Link
              to="/load-testing"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md border border-border bg-card hover:bg-accent transition-colors"
            >
              <Activity className="h-3.5 w-3.5" />
              Voir le load test
            </Link>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
              <PlayCircle className="h-3.5 w-3.5" />
              Lancer un benchmark
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard
          label="Latence p95 (composé)"
          value="14"
          unit="ms"
          delta={{ value: "−99.6 %", direction: "down", positive: true }}
          hint="vs collection sans index"
        />
        <MetricCard
          label="Throughput max"
          value="974"
          unit="req/s"
          delta={{ value: "+1289 %", direction: "up", positive: true }}
          hint="cible 1000 req/s atteinte à 97 %"
        />
        <MetricCard
          label="Documents scannés"
          value="1"
          unit="/ requête"
          delta={{ value: "−5M", direction: "down", positive: true }}
          hint="IXSCAN vs COLLSCAN intégral"
        />
        <MetricCard
          label="Coût en écriture"
          value="+62 %"
          delta={{ value: "+292 ms", direction: "up", positive: false }}
          hint="overhead bulk insert 100k"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="console-card p-4 xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold">Temps de réponse — fenêtre 30s</h3>
              <p className="text-[11px] text-muted-foreground">
                Échantillonnage 1Hz • cas d'usage recherche par email
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <LegendDot color="var(--chart-4)" label="no_index" />
              <LegendDot color="var(--chart-2)" label="single_index" />
              <LegendDot color="var(--chart-3)" label="compound_index" />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={TIMESERIES}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} unit="ms" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="no_index" stroke="var(--chart-4)" strokeWidth={1.8} dot={false} />
                <Line type="monotone" dataKey="single_index" stroke="var(--chart-2)" strokeWidth={1.8} dot={false} />
                <Line type="monotone" dataKey="compound_index" stroke="var(--chart-3)" strokeWidth={1.8} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="console-card p-4">
          <h3 className="text-sm font-semibold mb-3">Distribution latence</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={RESPONSE_TIME}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="collection" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} unit="ms" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                <Bar dataKey="avg" fill="var(--chart-2)" name="moyenne" />
                <Bar dataKey="p95" fill="var(--chart-1)" name="p95" />
                <Bar dataKey="p99" fill="var(--chart-4)" name="p99" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="console-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Collections surveillées</h3>
            <p className="text-[11px] text-muted-foreground">3 collections identiques, indexation différente</p>
          </div>
          <Link to="/collections" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">
            Gérer les collections <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <table className="w-full text-[13px]">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-2">Collection</th>
              <th className="text-left font-medium px-4 py-2">Index</th>
              <th className="text-right font-medium px-4 py-2">Documents</th>
              <th className="text-right font-medium px-4 py-2">Taille index</th>
              <th className="text-left font-medium px-4 py-2">Stage</th>
              <th className="text-left font-medium px-4 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {COLLECTIONS.map((c) => (
              <tr key={c.key} className="border-t border-border hover:bg-accent/40">
                <td className="px-4 py-2.5 font-mono">
                  <div className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5 text-muted-foreground" />
                    {c.name}
                  </div>
                </td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground text-xs">{c.index}</td>
                <td className="px-4 py-2.5 text-right font-mono">{c.documents.toLocaleString("fr-FR")}</td>
                <td className="px-4 py-2.5 text-right font-mono">{c.indexSize}</td>
                <td className="px-4 py-2.5">
                  <span className={c.key === "no_index" ? "console-chip bg-destructive/15 text-destructive border border-destructive/30" : "console-chip bg-success/15 text-success border border-success/30"}>
                    {c.key === "no_index" ? "COLLSCAN" : "IXSCAN"}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {c.status === "critical" && (
                    <span className="inline-flex items-center gap-1 text-destructive text-xs font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" /> Critique
                    </span>
                  )}
                  {c.status === "warning" && (
                    <span className="inline-flex items-center gap-1 text-warning text-xs font-medium">
                      <Zap className="h-3.5 w-3.5" /> Acceptable
                    </span>
                  )}
                  {c.status === "healthy" && (
                    <span className="inline-flex items-center gap-1 text-success text-xs font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Optimal
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
