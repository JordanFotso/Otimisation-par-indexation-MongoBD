import { ChevronRight, Search, Bell, CircleUser, HelpCircle } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

const LABELS: Record<string, string> = {
  "/": "Vue d'ensemble",
  "/collections": "Collections",
  "/scenarios": "Scénarios",
  "/load-testing": "Load Testing",
  "/explain": "Explain Plan",
  "/comparison": "Comparaison",
  "/resources": "Ressources",
};

export function TopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = LABELS[pathname] ?? "Console";

  return (
    <header className="bg-topbar text-topbar-foreground border-b border-border">
      {/* Top AWS-style chrome */}
      <div className="h-11 flex items-center px-4 gap-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-sm bg-primary flex items-center justify-center text-primary-foreground font-bold text-[11px]">
            MX
          </div>
          <span className="text-sm font-semibold tracking-tight">MongoDB Index Console</span>
        </div>

        <nav className="hidden lg:flex items-center gap-1 ml-4 text-[13px] text-topbar-foreground/80">
          <button className="px-2.5 py-1 rounded hover:bg-white/5">Services</button>
          <button className="px-2.5 py-1 rounded hover:bg-white/5">Workspaces</button>
          <button className="px-2.5 py-1 rounded hover:bg-white/5">Documentation</button>
        </nav>

        <div className="flex-1 max-w-xl mx-auto relative">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Rechercher collections, requêtes, métriques [/]"
            className="w-full bg-white/5 border border-white/10 rounded-md pl-9 pr-3 py-1.5 text-[13px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/60"
          />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button className="h-8 w-8 grid place-items-center rounded hover:bg-white/5 text-topbar-foreground/80">
            <HelpCircle className="h-4 w-4" />
          </button>
          <button className="h-8 w-8 grid place-items-center rounded hover:bg-white/5 text-topbar-foreground/80">
            <Bell className="h-4 w-4" />
          </button>
          <div className="h-5 w-px bg-white/10 mx-1" />
          <div className="hidden md:flex flex-col items-end leading-tight pr-2">
            <span className="text-[12px] font-medium">admin@mongoperf</span>
            <span className="text-[10px] text-muted-foreground">eu-west-1 / prod</span>
          </div>
          <button className="h-8 w-8 grid place-items-center rounded hover:bg-white/5">
            <CircleUser className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Breadcrumb strip */}
      <div className="h-9 px-4 flex items-center gap-1.5 text-[12px] border-t border-white/5 bg-background/60">
        <span className="text-muted-foreground">Console</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-muted-foreground">MongoDB</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-foreground font-medium">{current}</span>
      </div>
    </header>
  );
}
