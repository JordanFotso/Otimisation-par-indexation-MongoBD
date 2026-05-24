import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { useComparison } from "@/hooks/use-comparison";
import { useResponseTime } from "@/hooks/use-metrics";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/comparison")({
  component: Comparison,
});

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  fontSize: "12px",
  fontFamily: "var(--font-mono)",
};

function Comparison() {
  const { data: comparison, isLoading: loadingComp } = useComparison();
  const { data: responseTime, isLoading: loadingRes } = useResponseTime();

  if (loadingComp || loadingRes) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Comparaison"
        description="Synthèse multi-axes des trois stratégies. Évalue le compromis lecture / écriture / stockage."
        actions={
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-md border border-border bg-card hover:bg-accent">
            <Download className="h-3.5 w-3.5" /> Exporter CSV
          </button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <div className="console-card p-4">
          <h3 className="text-sm font-semibold mb-3">Profil multi-axes</h3>
          <div className="h-80">
            <ResponsiveContainer>
              <RadarChart data={comparison?.radar}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <PolarRadiusAxis stroke="var(--border)" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <Radar name="no_index" dataKey="no_index" stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.2} />
                <Radar name="single_index" dataKey="single_index" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.2} />
                <Radar name="compound_index" dataKey="compound_index" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.2} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="console-card p-4">
          <h3 className="text-sm font-semibold mb-3">Coût en écriture (ms)</h3>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={comparison?.writePerf}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="op" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} unit="ms" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                <Bar dataKey="no_index" name="Aucun" fill="var(--chart-4)" />
                <Bar dataKey="single_index" name="Simple" fill="var(--chart-2)" />
                <Bar dataKey="compound_index" name="Composé" fill="var(--chart-3)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="console-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Tableau comparatif final</h3>
        </div>
        <table className="w-full text-[13px]">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-2">Collection</th>
              <th className="text-left font-medium px-4 py-2">Index</th>
              <th className="text-right font-medium px-4 py-2">Temps moyen</th>
              <th className="text-right font-medium px-4 py-2">p95</th>
              <th className="text-right font-medium px-4 py-2">p99</th>
              <th className="text-left font-medium px-4 py-2">Stage</th>
              <th className="text-left font-medium px-4 py-2">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {responseTime?.map((r, i) => {
              const tags = [
                { stage: "COLLSCAN", verdict: "Inutilisable à grande échelle", tone: "destructive" },
                { stage: "IXSCAN", verdict: "Bon pour lookups simples", tone: "warning" },
                { stage: "IXSCAN optimisé", verdict: "Optimal pour requêtes complexes", tone: "success" },
              ][i];
              const idx = ["—", "{ email: 1 }", "{ status, createdAt, email }"][i];
              const toneClass =
                tags.tone === "destructive"
                  ? "bg-destructive/15 text-destructive border border-destructive/30"
                  : tags.tone === "warning"
                  ? "bg-warning/15 text-warning border-warning/30"
                  : "bg-success/15 text-success border border-success/30";
              return (
                <tr key={r.collection} className="border-t border-border hover:bg-accent/40">
                  <td className="px-4 py-2.5 font-mono">{r.collection}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{idx}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{r.avg} ms</td>
                  <td className="px-4 py-2.5 text-right font-mono">{r.p95} ms</td>
                  <td className="px-4 py-2.5 text-right font-mono">{r.p99} ms</td>
                  <td className="px-4 py-2.5">
                    <span className={`console-chip border ${toneClass}`}>{tags.stage}</span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{tags.verdict}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 console-card p-5">
        <h3 className="text-sm font-semibold mb-2">Conclusion</h3>
        <ul className="space-y-1.5 text-[13px] text-muted-foreground list-disc pl-5">
          <li>Les index réduisent le temps de réponse de plusieurs ordres de grandeur.</li>
          <li>COLLSCAN devient inopérant au-delà de quelques centaines de requêtes par seconde.</li>
          <li>L'index composé domine sur les requêtes complexes (filtre + tri + pagination).</li>
          <li>Compromis : Le coût d'écriture augmente avec le nombre d'index (plus de maintenance).</li>
        </ul>
      </div>
    </>
  );
}
