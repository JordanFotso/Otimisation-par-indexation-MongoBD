import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { RESOURCES } from "@/lib/mock-data";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export const Route = createFileRoute("/resources")({
  component: Resources,
});

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  fontSize: "12px",
  fontFamily: "var(--font-mono)",
};

function Resources() {
  return (
    <>
      <PageHeader
        title="Ressources"
        description="Consommation CPU backend, RAM MongoDB et I/O disque pendant la fenêtre de benchmark."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <MetricCard label="CPU backend (no_index)" value="92" unit="%" delta={{ value: "+47 %", direction: "up", positive: false }} />
        <MetricCard label="RAM MongoDB" value="56" unit="%" hint="working set en mémoire" />
        <MetricCard label="Connexions actives" value="248" unit="/ 500" />
        <MetricCard label="Page faults" value="1.2k" unit="/min" delta={{ value: "−84 %", direction: "down", positive: true }} />
      </div>

      <div className="console-card p-4">
        <h3 className="text-sm font-semibold mb-3">Consommation par stratégie d'index (% utilisation)</h3>
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={RESOURCES} layout="vertical">
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} unit="%" domain={[0, 100]} />
              <YAxis dataKey="metric" type="category" stroke="var(--muted-foreground)" fontSize={11} width={120} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <Bar dataKey="no_index" fill="var(--chart-4)" />
              <Bar dataKey="single_index" fill="var(--chart-2)" />
              <Bar dataKey="compound_index" fill="var(--chart-3)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
