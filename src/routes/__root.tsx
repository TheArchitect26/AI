import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { NexusShell } from "@/components/nexus/shell";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-lg p-8 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neon-cyan">Signal lost</div>
        <h1 className="mt-2 font-mono text-6xl font-bold gradient-text">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">This module is not registered in the kernel.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md border border-neon-cyan/40 bg-[color-mix(in_oklab,var(--neon-cyan)_10%,transparent)] px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-neon-cyan hover:glow-cyan">
          Return to Command Center
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-lg p-8 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--neon-red)]">Kernel fault</div>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Module crashed</h1>
        <p className="mt-2 text-xs text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md border border-neon-cyan/40 px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-neon-cyan">
            Retry
          </button>
          <a href="/" className="rounded-md border border-border px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NEXUS — Personal AI Operating System" },
      { name: "description", content: "NEXUS: a local-first personal AI operating system with multi-agent orchestration, trading intelligence, memory, and automation." },
      { name: "theme-color", content: "#0a0a18" },
      { property: "og:title", content: "NEXUS — Personal AI OS" },
      { property: "og:description", content: "Multi-agent AI control system. Trading intel. Memory. Automation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <NexusShell />
    </QueryClientProvider>
  );
}
