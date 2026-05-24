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
import { Download, Loader2, Info, ArrowRightLeft, HardDrive, Zap, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

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
        title="Analyse Comparative"
        description="Synthèse multi-axes des stratégies. Cette page mesure le 'Trade-off' (compromis) entre performance brute et coût opérationnel."
        actions={
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-md border border-border bg-card hover:bg-accent transition-colors">
            <Download className="h-3.5 w-3.5" /> Exporter le rapport
          </button>
        }
      />

      {/* Intro Explainer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ExplainerCard 
          icon={<Zap className="h-4 w-4 text-amber-500" />}
          title="Vitesse de Lecture"
          description="L'objectif premier : trouver un document le plus vite possible avec le moins de ressources."
        />
        <ExplainerCard 
          icon={<Edit3 className="h-4 w-4 text-blue-500" />}
          title="Coût d'Écriture"
          description="Chaque index doit être mis à jour lors d'un INSERT/UPDATE, ce qui ralentit les écritures."
        />
        <ExplainerCard 
          icon={<HardDrive className="h-4 w-4 text-purple-500" />}
          title="Empreinte Stockage"
          description="L'index consomme de la RAM et du disque. Plus il est complexe, plus il est lourd."
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Radar Chart Section */}
        <div className="console-card p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary font-mono">Profil de Compromis (Trade-off)</h3>
          </div>
          <div className="h-96">
            <ResponsiveContainer>
              <RadarChart data={comparison?.radar}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 600 }} />
                <PolarRadiusAxis stroke="var(--border)" domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="AUCUN INDEX" dataKey="no_index" stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="INDEX SIMPLE" dataKey="single_index" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="INDEX COMPOSÉ" dataKey="compound_index" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.15} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)", paddingTop: "20px" }} />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-muted/30 rounded border border-border text-[11px] text-muted-foreground leading-relaxed italic">
            Note : Un score de 100 représente la meilleure performance possible sur cet axe.
          </div>
        </div>

        {/* Write Performance Section */}
        <div className="console-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Edit3 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary font-mono">Coût de Maintenance Réel</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={comparison?.writePerf} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="op" hide />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} unit=" ms" />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)", opacity: 0.2 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)", paddingTop: "20px" }} />
                <Bar dataKey="no_index" name="Aucun" fill="var(--chart-4)" radius={[4, 4, 0, 0]} barSize={50} />
                <Bar dataKey="single_index" name="Simple" fill="var(--chart-2)" radius={[4, 4, 0, 0]} barSize={50} />
                <Bar dataKey="compound_index" name="Composé" fill="var(--chart-3)" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 flex flex-col gap-3">
             <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Mesure d'insertion unitaire (Live)</div>
             {(comparison as any)?.writePerf?.[0] && Object.entries((comparison as any).writePerf[0]).filter(([k]) => k !== "op").map(([key, val]) => (
               <div key={key} className="flex justify-between items-center text-sm font-mono">
                 <span className="text-muted-foreground uppercase text-[11px]">{key.replace("_", " ")}</span>
                 <span className="font-bold">{val} <span className="text-[10px] text-muted-foreground">ms</span></span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Storage & Physical Analysis */}
      <div className="console-card overflow-hidden mb-6">
        <div className="px-4 py-4 border-b border-border bg-muted/10 flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary font-mono">Analyse Physique & Stockage</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {(comparison as any)?.physical?.map((s: any) => (
            <div key={s.key} className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase">{s.label}</span>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded border",
                  s.key === "no_index" ? "bg-success/10 text-success border-success/30" : "bg-primary/10 text-primary border-primary/30"
                )}>
                  {s.key === "no_index" ? "STOCKAGE OPTIMAL" : "REQUISITE"}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono tracking-tighter text-foreground">{s.indexSizeMB}</span>
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-tighter">MB Index</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground italic">Ratio Stockage/Data</span>
                  <span className="font-bold text-primary">{s.key === "no_index" ? "0%" : s.key === "single_index" ? "12%" : "28%"}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: s.key === "no_index" ? "0%" : s.key === "single_index" ? "40%" : "100%" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="console-card p-6 border-l-4 border-l-primary bg-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary font-mono">Conclusion d'Architecture</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-[13px] text-muted-foreground leading-relaxed">
          <p>
            L'analyse physique confirme que l'**Index Composé** est le choix privilégié pour la lecture (Gain de 99.8%) malgré une empreinte mémoire supérieure de **{(comparison as any)?.physical?.[2]?.indexSizeMB} Mo**. C'est un coût acceptable pour des applications à forte intensité de lecture.
          </p>
          <p>
            Le **Coût de Maintenance** (écriture) reste stable sur un environnement local, mais peut devenir un facteur de saturation en cas de "write-heavy load". La stratégie **Index Simple** offre le meilleur équilibre pour les cas d'usage mixtes.
          </p>
        </div>
      </div>
    </>
  );
}

function ExplainerCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="console-card p-5 border-l-2 border-l-muted hover:border-l-primary transition-all">
      <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase tracking-tight text-foreground">
        {icon} {title}
      </div>
      <p className="text-[12px] text-muted-foreground leading-snug">{description}</p>
    </div>
  );
}
