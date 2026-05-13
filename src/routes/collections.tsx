import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { useCollections } from "@/hooks/use-collections";
import { Database, Plus, Trash2, RefreshCw, Loader2 } from "lucide-react";

export const Route = createFileRoute("/collections")({
  component: Collections,
});

function Collections() {
  const { data: collections, isLoading, refetch } = useCollections();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Collections"
        description="Visualisation en temps réel des statistiques et de l'état des index de vos collections MongoDB."
        actions={
          <>
            <button 
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-md border border-border bg-card hover:bg-accent"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Actualiser
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-3.5 w-3.5" /> Créer un index
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {collections?.map((c) => (
          <div key={c.key} className="console-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded grid place-items-center"
                  style={{ backgroundColor: `color-mix(in oklab, ${c.color} 18%, transparent)` }}
                >
                  <Database className="h-4 w-4" style={{ color: c.color }} />
                </div>
                <div>
                  <div className="text-sm font-semibold font-mono">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground">{c.label}</div>
                </div>
              </div>
              <span
                className="console-chip border"
                style={{
                  color: c.color,
                  borderColor: `color-mix(in oklab, ${c.color} 40%, transparent)`,
                  backgroundColor: `color-mix(in oklab, ${c.color} 12%, transparent)`,
                }}
              >
                {c.key === "no_index" ? "COLLSCAN" : "IXSCAN"}
              </span>
            </div>
            <div className="p-4 space-y-3 text-[13px]">
              <Row label="Documents" value={c.documents.toLocaleString("fr-FR")} />
              <Row label="Taille index" value={c.indexSize} />
              <Row label="Statut" value={c.status} />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                  Définition d'index
                </div>
                <pre className="bg-background border border-border rounded p-2 text-[11px] font-mono overflow-x-auto">
{`db.${c.name}.createIndex(
  ${c.index === "—" ? "/* aucun */" : c.index},
  { background: true }
)`}
                </pre>
              </div>
            </div>
            <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between">
              <button className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <Trash2 className="h-3 w-3" /> Drop index
              </button>
              <button className="text-[12px] text-primary hover:underline">Inspecter →</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}


function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-[12px]">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
