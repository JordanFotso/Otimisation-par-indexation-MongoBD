import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { useScenarios } from "@/hooks/use-scenarios";
import { useState } from "react";
import { Send, Save, Code2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scenarios")({
  component: Scenarios,
});

function Scenarios() {
  const { data: scenarios, isLoading } = useScenarios();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<"params" | "query" | "response">("query");

  if (isLoading || !scenarios) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const scenario = scenarios.find((s) => s.id === (activeId || scenarios[0].id))!;

  return (
    <>
      <PageHeader
        title="Scénarios"
        description="Atelier de requêtes inspiré de Postman. Définissez le cas d'usage, exécutez sur les 3 collections et inspectez la réponse."
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Sidebar requests */}
        <div className="col-span-12 md:col-span-3 console-card overflow-hidden">
          <div className="px-3 py-2 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
            Collection de requêtes
          </div>
          <ul>
            {scenarios.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setActiveId(s.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[13px] flex items-start gap-2 border-l-2 transition-colors",
                    (activeId || scenarios[0].id) === s.id
                      ? "border-primary bg-accent/60"
                      : "border-transparent hover:bg-accent/40"
                  )}
                >
                  <span className="console-chip bg-success/15 text-success border border-success/30 mt-0.5">
                    {s.method}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate font-mono">
                      {s.path}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Workspace */}
        <div className="col-span-12 md:col-span-9 console-card overflow-hidden flex flex-col">
          {/* ... suite du code (URL bar, Tabs, etc.) ... */}
          <div className="p-3 border-b border-border flex items-center gap-2">
            <select className="bg-background border border-border rounded px-2 py-1.5 text-[12px] font-mono font-semibold text-success">
              <option>{scenario.method}</option>
            </select>
            <input
              defaultValue={scenario.path}
              className="flex-1 bg-background border border-border rounded px-2.5 py-1.5 text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
              <Send className="h-3.5 w-3.5" /> Envoyer
            </button>
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] rounded-md border border-border hover:bg-accent">
              <Save className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex border-b border-border text-[12px]">
            {(["params", "query", "response"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-4 py-2 font-medium border-b-2 -mb-px capitalize",
                  tab === t
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "params" ? "Params" : t === "query" ? "Mongo Query" : "Response"}
              </button>
            ))}
          </div>

          <div className="p-4 min-h-[320px]">
            {tab === "params" && (
              <table className="w-full text-[13px]">
                <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="text-left font-medium py-1.5 w-1/3">Clé</th>
                    <th className="text-left font-medium py-1.5">Valeur</th>
                    <th className="text-left font-medium py-1.5">Description</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {scenario.filters.map((f) => (
                    <tr key={f} className="border-b border-border/60">
                      <td className="py-2">{f}</td>
                      <td className="py-2 text-muted-foreground">
                        {f === "email" ? "user42@acme.io" : f === "status" ? "active" : "2024-01-01"}
                      </td>
                      <td className="py-2 text-muted-foreground text-xs">
                        Filtre indexable haute cardinalité
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === "query" && (
              <pre className="bg-background border border-border rounded p-3 text-[12px] font-mono overflow-x-auto">
{`db.users_compound_index.find(
  ${JSON.stringify(buildFilter(scenario.id), null, 2)}
)
.sort({ createdAt: -1 })
.skip(${scenario.id === "S3" ? 41 * 20 : 0})
.limit(20)
.explain("executionStats")`}
              </pre>
            )}

            {tab === "response" && (
              <div>
                <div className="flex items-center gap-3 mb-3 text-[12px] font-mono">
                  <span className="console-chip bg-success/15 text-success border border-success/30">200 OK</span>
                  <span className="text-muted-foreground">14 ms</span>
                  <span className="text-muted-foreground">1.2 KB</span>
                  <span className="text-muted-foreground">IXSCAN</span>
                </div>
                <pre className="bg-background border border-border rounded p-3 text-[12px] font-mono overflow-x-auto">
{`{
  "data": [{
    "_id": "65f12...a8",
    "email": "user42@acme.io",
    "status": "active",
    "createdAt": "2024-09-12T10:14:22Z"
  }],
  "stats": {
    "stage": "IXSCAN",
    "totalDocsExamined": 1,
    "totalKeysExamined": 1,
    "executionTimeMillis": 4
  }
}`}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function buildFilter(id: string) {
  if (id === "S1") return { email: "user42@acme.io" };
  if (id === "S2") return { status: "active", createdAt: { $gte: "2024-01-01" } };
  return { status: "active", createdAt: { $gte: "2024-01-01" } };
}
