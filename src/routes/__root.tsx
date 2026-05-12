import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { ConsoleSidebar } from "@/components/console-sidebar";
import { TopBar } from "@/components/top-bar";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold text-foreground font-mono">404</h1>
        <h2 className="mt-3 text-lg font-semibold">Ressource introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page de la console n'existe pas.
        </p>
        <Link
          to="/"
          className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-lg font-semibold">Erreur de la console</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MongoDB Index Console — Optimisation & Benchmark" },
      { name: "description", content: "Console d'analyse des stratégies d'indexation MongoDB : COLLSCAN vs IXSCAN, latence p95/p99, throughput et explain plan." },
      { property: "og:title", content: "MongoDB Index Console — Optimisation & Benchmark" },
      { name: "twitter:title", content: "MongoDB Index Console — Optimisation & Benchmark" },
      { property: "og:description", content: "Console d'analyse des stratégies d'indexation MongoDB : COLLSCAN vs IXSCAN, latence p95/p99, throughput et explain plan." },
      { name: "twitter:description", content: "Console d'analyse des stratégies d'indexation MongoDB : COLLSCAN vs IXSCAN, latence p95/p99, throughput et explain plan." },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col h-screen bg-background text-foreground">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <ConsoleSidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 max-w-[1500px] mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
