import { createFileRoute } from "@tanstack/react-router";
import { GlassPanel, SectionHeader, StatusDot, NeonButton } from "@/components/nexus/primitives";
import { useEffect, useState } from "react";

type VaultFile = { id: string; originalName: string; kind: string; status: string; summary: string | null; size: number };

export const Route = createFileRoute("/vault")({ component: Page });

function Page() {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const refresh = async () => {
    const res = await fetch("/api/files");
    const payload = (await res.json()) as { files?: VaultFile[] };
    setFiles(payload.files || []);
  };

  useEffect(() => { void refresh(); }, []);

  const upload = async (file: File) => {
    const data = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
    const res = await fetch("/api/files", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, contentBase64: base64 }) });
    if (!res.ok) { const p = await res.json(); setError(p.error || "Upload failed"); return; }
    setError("");
    void refresh();
  };

  const preview = async (id: string) => {
    const res = await fetch(`/api/files/${id}/content`);
    const payload = (await res.json()) as { content?: string; error?: string };
    setContent(payload.content || payload.error || "No preview");
  };

  const analyze = async (id: string) => { await fetch(`/api/files/${id}/analyze`, { method: "POST" }); void refresh(); };
  const saveToMemory = async (id: string) => { await fetch(`/api/files/${id}/save-summary-to-memory`, { method: "POST" }); };
  const removeFile = async (id: string) => { await fetch(`/api/files/${id}`, { method: "DELETE" }); void refresh(); };

  return (
    <div className="space-y-6">
      <GlassPanel className="relative overflow-hidden p-6" scanline>
        <div className="relative"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-neon-cyan"><StatusDot pulse /> Personal corpus</div><h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Knowledge Vault</h1></div>
      </GlassPanel>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassPanel className="lg:col-span-2">
          <SectionHeader eyebrow="Files" title="Uploads" right={<input type="file" accept=".txt,.md,.json,.csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />} />
          {error && <div className="px-5 pb-2 text-xs text-status-error">{error}</div>}
          <div className="space-y-2 p-5">
            {files.map((f) => (
              <div key={f.id} className="rounded border border-border/60 p-3 text-xs">
                <div className="flex items-center justify-between"><span>{f.originalName}</span><span>{f.kind} · {f.status}</span></div>
                <div className="mt-2 flex gap-2"><NeonButton variant="ghost" onClick={() => void preview(f.id)}>Preview</NeonButton><NeonButton variant="ghost" onClick={() => void analyze(f.id)}>Analyze</NeonButton><NeonButton variant="ghost" onClick={() => void saveToMemory(f.id)}>Save Summary</NeonButton><NeonButton variant="ghost" onClick={() => void removeFile(f.id)}>Delete</NeonButton></div>
                {f.summary && <p className="mt-2 text-muted-foreground">{f.summary}</p>}
              </div>
            ))}
          </div>
        </GlassPanel>
        <GlassPanel>
          <SectionHeader eyebrow="Preview" title="File content" />
          <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap p-4 text-xs text-muted-foreground">{content || "Select a file preview"}</pre>
        </GlassPanel>
      </div>
    </div>
  );
}
