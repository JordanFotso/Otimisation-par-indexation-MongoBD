import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Database,
  Workflow,
  Gauge,
  ScanSearch,
  BarChart3,
  Server,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  {
    label: "Workspace",
    items: [
      { to: "/", label: "Vue d'ensemble", icon: LayoutDashboard },
      { to: "/collections", label: "Collections", icon: Database },
      { to: "/scenarios", label: "Scénarios", icon: Workflow },
    ],
  },
  {
    label: "Performance",
    items: [
      { to: "/load-testing", label: "Load Testing", icon: Gauge },
      { to: "/explain", label: "Explain Plan", icon: ScanSearch },
      { to: "/comparison", label: "Comparaison", icon: BarChart3 },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      { to: "/resources", label: "Ressources", icon: Server },
    ],
  },
];

export function ConsoleSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-sm bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            M
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Console</span>
            <span className="text-sm font-semibold">Index Optimizer</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </div>
            <ul>
              {group.items.map((item) => {
                const active = pathname === item.to;
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2.5 px-4 py-1.5 text-[13px] border-l-2 transition-colors",
                        active
                          ? "border-primary bg-sidebar-accent text-sidebar-accent-foreground"
                          : "border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-sidebar-border flex items-center gap-2 text-xs text-muted-foreground">
        <Settings className="h-3.5 w-3.5" />
        <span>v1.0 • mongo://prod-cluster</span>
      </div>
    </aside>
  );
}
