import { createFileRoute } from "@tanstack/react-router";
import { GlassPanel, SectionHeader, StatusDot, NeonButton } from "@/components/nexus/primitives";
import { useEffect, useState } from "react";

type FileRecord = {
  id: string;
  originalName: string;
  kind: string;
  size: number;
  summary: string | null;
};

export const Route = createFileRoute("/vault")({ component: Page });

function Page() {
  const [name, setName] = useState("notes.txt");
  const [content, setContent] = useState("Paste text/markdown/json/csv content here...");
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [selected, setSelected] = useState<FileRecord | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  const refresh = async () => {
    const res = await fetch("/api/files");
    const payload = (await res.json()) as { files?: FileRecord[] };
    setFiles(payload.files || []);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const upload = async () => {
    setError("");
    const res = await fetch("/api/files", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, content, mimeType: "text/plain" }) });
    const payload = await res.json();
    if (!res.ok) return setError(payload.error || "Upload failed");
    setName("notes.txt");
    setContent("");
    await refresh();
  };

  const openPreview = async (id: string) => {
    const res = await fetch(`/api/files/${id}/content`);
    const payload = await res.json();
    if (!res.ok) return setError(payload.error || "Preview failed");
    setPreview(payload.content || "");
    setSelected(payload.file || null);
  };

  const analyze = async (id: string) => {
    const res = await fetch(`/api/files/${id}/analyze`, { method: "POST" });
    const payload = await res.json();
    if (!res.ok) return setError(payload.error || "Analyze failed");
    setPreview(payload.summary || "");
    await refresh();
  };

  const saveSummary = async (id: string) => {
    const res = await fetch(`/api/files/${id}/save-summary-to-memory`, { method: "POST" });
    const payload = await res.json();
    if (!res.ok) return setError(payload.error || "Save summary failed");
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
    const payload = await res.json();
    if (!res.ok) return setError(payload.error || "Delete failed");
    await refresh();
  };

  return (
    <div className="space-y-6">
      <GlassPanel className="relative overflow-hidden p-6" scanline>
        <div className="relative">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-neon-cyan"><StatusDot pulse /> Personal corpus</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Knowledge Vault</h1>
        </div>
      </GlassPanel>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassPanel className="lg:col-span-2">
          <SectionHeader eyebrow="Files" title="Upload knowledge" right={<NeonButton onClick={upload}>Upload</NeonButton>} />
          <div className="space-y-2 p-4">
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border border-border/60 bg-transparent p-2 text-sm" />
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="w-full rounded border border-border/60 bg-transparent p-2 text-sm" />
            {error && <div className="text-xs text-status-error">{error}</div>}
          </div>
        </GlassPanel>
        <GlassPanel>
          <SectionHeader eyebrow="Stored" title="Files" />
          <div className="space-y-2 p-3">
            {files.map((f) => (
              <div key={f.id} className="rounded border border-border/50 p-2 text-xs">
                <div className="font-medium">{f.originalName}</div>
                <div className="text-muted-foreground">{f.kind} · {f.size}b</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <NeonButton variant="ghost" onClick={() => void openPreview(f.id)}>Preview</NeonButton>
                  <NeonButton variant="ghost" onClick={() => void analyze(f.id)}>Analyze</NeonButton>
                  <NeonButton variant="ghost" onClick={() => void saveSummary(f.id)}>Save Summary</NeonButton>
                  <NeonButton variant="ghost" onClick={() => void remove(f.id)}>Delete</NeonButton>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
      {selected && (
        <GlassPanel>
          <SectionHeader eyebrow="Preview" title={selected.originalName} />
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap p-4 text-xs">{preview}</pre>
        </GlassPanel>
      )}
    </div>
  );
}
