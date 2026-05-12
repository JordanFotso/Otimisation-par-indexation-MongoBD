import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { EXPLAIN, COLLECTIONS } from "@/lib/mock-data";
import { ScanSearch, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/explain")({
  component: Explain,
});

function Explain() {
  return (
    <>
      <PageHeader
        title="Explain Plan"
        description="Inspection bas niveau de l'exécution MongoDB. Stage, documents examinés, clés d'index lues et temps d'exécution réel."
        actions={
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
            <ScanSearch className="h-3.5 w-3.5" /> Re-exécuter
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {COLLECTIONS.map((c) => {
          const e = EXPLAIN[c.key];
          const collscan = e.stage === "COLLSCAN";
          return (
            <div key={c.key} className="console-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</div>
                  <div className="text-sm font-semibold font-mono">{c.name}</div>
                </div>
                <span
                  className={
                    collscan
                      ? "console-chip bg-destructive/15 text-destructive border border-destructive/30"
                      : "console-chip bg-success/15 text-success border border-success/30"
                  }
                >
                  {e.stage}
                </span>
              </div>

              <div className="p-4 grid grid-cols-2 gap-3 text-[13px]">
                <Stat label="Docs examinés" value={e.totalDocsExamined.toLocaleString("fr-FR")} bad={collscan} />
                <Stat label="Clés examinées" value={e.totalKeysExamined.toLocaleString("fr-FR")} />
                <Stat label="Documents retournés" value={e.nReturned.toString()} />
                <Stat label="executionTime" value={`${e.executionTimeMillis} ms`} bad={collscan} />
              </div>

              <div className="px-4 pb-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                  Plan brut
                </div>
                <pre className="bg-background border border-border rounded p-3 text-[11px] font-mono overflow-x-auto leading-relaxed">
{JSON.stringify(
  {
    queryPlanner: {
      winningPlan: collscan
        ? { stage: "COLLSCAN", direction: "forward" }
        : {
            stage: "FETCH",
            inputStage: {
              stage: "IXSCAN",
              indexName: c.key === "compound_index" ? "status_1_createdAt_-1_email_1" : "email_1",
              keyPattern: c.key === "compound_index"
                ? { status: 1, createdAt: -1, email: 1 }
                : { email: 1 },
            },
          },
    },
    executionStats: {
      executionSuccess: true,
      nReturned: e.nReturned,
      executionTimeMillis: e.executionTimeMillis,
      totalKeysExamined: e.totalKeysExamined,
      totalDocsExamined: e.totalDocsExamined,
    },
  },
  null,
  2
)}
                </pre>
              </div>

              <div className="px-4 py-2.5 border-t border-border bg-muted/30 text-[12px] flex items-center gap-2">
                {collscan ? (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-destructive">Scan complet — non scalable</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    <span className="text-success">Index utilisé efficacement</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Stat({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-mono text-base ${bad ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}
