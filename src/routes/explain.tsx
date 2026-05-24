import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { ScanSearch, AlertTriangle, CheckCircle2, Loader2, Database, Search, Target, Gauge } from "lucide-react";
import { useCollections } from "@/hooks/use-collections";
import { useExplain } from "@/hooks/use-execute-scenario";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explain")({
  component: Explain,
});

function Explain() {
  const [email, setEmail] = useState("test_1@example.com");
  const [searchInput, setSearchInput] = useState("test_1@example.com");
  const { data: collections, isLoading: loadingCols } = useCollections();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail(searchInput);
  };

  if (loadingCols) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Query Analyzer"
        description="Outil d'expertise MongoDB. Analysez l'efficacité de vos filtres sur chaque stratégie d'indexation en temps réel."
      />

      {/* Query Lab Bar */}
      <div className="console-card p-4 mb-6 flex items-center gap-4 border-primary/20 bg-primary/5">
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Saisir un email pour analyser (ex: test_42@example.com)"
              className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none font-mono"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Target className="h-4 w-4" /> Lancer l'analyse
          </button>
        </form>
        <div className="h-8 w-px bg-border mx-2 hidden md:block" />
        <div className="text-[11px] font-mono text-muted-foreground hidden lg:block uppercase tracking-tighter">
          Query: {`db.users.find({ email: "${email}" })`}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {collections?.map((c) => (
          <ExplainCard key={c.key} collection={c} email={email} />
        ))}
      </div>
    </>
  );
}

function ExplainCard({ collection, email }: { collection: any, email: string }) {
  const { data: e, isLoading, isError, refetch } = useExplain(collection.key, email);

  if (isLoading) {
    return (
      <div className="console-card p-12 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
        </div>
        <span className="text-[11px] text-muted-foreground uppercase font-black tracking-widest">Analyse en cours...</span>
      </div>
    );
  }

  if (isError || !e) {
    return (
      <div className="console-card p-8 text-center flex flex-col items-center gap-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <div className="text-sm font-semibold">Échec de la communication avec MongoDB</div>
        <button onClick={() => refetch()} className="text-xs text-primary underline">Réessayer</button>
      </div>
    );
  }

  const analysis = (e as any).analysis;
  const score = analysis?.score || 0;
  const isHealthy = score >= 80;
  const isWarning = score >= 40 && score < 80;

  return (
    <div className={cn(
      "console-card overflow-hidden transition-all border-t-4",
      isHealthy ? "border-t-success" : isWarning ? "border-t-warning" : "border-t-destructive"
    )}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-border bg-muted/10">
        <div className="flex justify-between items-start mb-1">
          <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
            {collection.label}
          </span>
          <div className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
            isHealthy ? "bg-success/10 text-success border-success/30" : 
            isWarning ? "bg-warning/10 text-warning border-warning/30" : 
            "bg-destructive/10 text-destructive border-destructive/30"
          )}>
            SCORE: {score}/100
          </div>
        </div>
        <div className="text-sm font-mono font-bold flex items-center gap-1.5">
          <Database className="h-4 w-4 opacity-40" />
          {collection.name}
        </div>
      </div>

      {/* Main Verdict */}
      <div className="p-4 bg-accent/20">
        <div className="text-[11px] font-black text-muted-foreground uppercase mb-1 flex items-center gap-1.5">
          <Gauge className="h-3 w-3" /> Verdict de l'expert
        </div>
        <p className={cn(
          "text-[13px] font-medium leading-snug",
          isHealthy ? "text-success" : isWarning ? "text-warning" : "text-destructive"
        )}>
          {analysis?.verdict}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="p-4 grid grid-cols-2 gap-4 border-y border-border/50">
        <div className="space-y-3">
          <Stat label="Docs examinés" value={e.totalDocsExamined.toLocaleString()} bad={!isHealthy && e.totalDocsExamined > 1} />
          <Stat label="Clés lues" value={e.totalKeysExamined.toLocaleString()} />
        </div>
        <div className="space-y-3">
          <Stat label="Temps moteur" value={`${e.executionTimeMillis}ms`} bad={e.executionTimeMillis > 10} />
          <Stat label="Ratio Efficacité" value={analysis?.ratio} bad={parseFloat(analysis?.ratio) < 1} />
        </div>
      </div>

      {/* Alerts */}
      {analysis?.alerts?.length > 0 && (
        <div className="p-4 space-y-2">
          {analysis.alerts.map((alert: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-[11px] text-destructive font-bold bg-destructive/5 p-2 rounded border border-destructive/10">
              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
              {alert}
            </div>
          ))}
        </div>
      )}

      {/* Raw Plan (Collapsible in real app, scrollable here) */}
      <div className="px-4 pb-4 mt-2">
        <div className="text-[10px] font-black text-muted-foreground uppercase mb-2 tracking-widest">Plan de requête (Raw)</div>
        <pre className="bg-background border border-border rounded p-3 text-[10px] font-mono overflow-y-auto max-h-[180px] leading-tight text-muted-foreground scrollbar-thin">
          {JSON.stringify(e.raw, null, 2)}
        </pre>
      </div>

      <div className="px-4 py-3 bg-muted/20 border-t border-border flex items-center gap-2">
        <div className={cn("h-2 w-2 rounded-full", isHealthy ? "bg-success" : isWarning ? "bg-warning" : "bg-destructive")} />
        <span className="text-[11px] font-bold uppercase tracking-tight">Stage: {e.stage}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{label}</span>
      <span className={cn(
        "text-sm font-mono font-black tabular-nums",
        bad ? "text-destructive" : "text-foreground"
      )}>
        {value}
      </span>
    </div>
  );
}
