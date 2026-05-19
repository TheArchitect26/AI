import { createFileRoute } from "@tanstack/react-router";
import { GlassPanel, SectionHeader, StatusDot, NeonButton, MetricTile } from "@/components/nexus/primitives";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FileCode2, Folder, Play, GitBranch, Terminal, Sparkles, Send, Save, Search, Plus, Loader2 } from "lucide-react";
import Editor, { type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

export const Route = createFileRoute("/workspace")({
  head: () => ({ meta: [{ title: "Code Workspace — NEXUS" }, { name: "description", content: "Monaco-powered AI pair-programming workspace" }] }),
  component: Page,
});

type FileEntry = { path: string; language: string; content: string; dirty?: boolean };

const INITIAL_FILES: FileEntry[] = [
  {
    path: "src/agents/research.ts",
    language: "typescript",
    content: `import { createAgent } from "@/kernel";\nimport { webSearch, vectorRecall } from "@/tools";\n\nexport const researchAgent = createAgent({\n  name: "research-agent",\n  model: "google/gemini-3-flash-preview",\n  tools: [webSearch, vectorRecall],\n  systemPrompt: \`\n    You are NEXUS' research subagent.\n    Decompose queries, gather sources, cite everything.\n  \`,\n  maxSteps: 8,\n});\n`,
  },
  {
    path: "src/agents/orchestrator.ts",
    language: "typescript",
    content: `import { route } from "@/kernel";\n\nexport const orchestrator = route({\n  agents: ["research", "trader", "scanner", "tools"],\n  policy: "least-load",\n});\n`,
  },
  {
    path: "src/trading/scanner.ts",
    language: "typescript",
    content: `export async function scanSymbols(symbols: string[]) {\n  return symbols.map(s => ({ s, vol: Math.random() }));\n}\n`,
  },
  {
    path: "README.md",
    language: "markdown",
    content: `# NEXUS Kernel\n\nPersonal AI operating system.\n`,
  },
];

function Page() {
  const [files, setFiles] = useState<FileEntry[]>(INITIAL_FILES);
  const [activePath, setActivePath] = useState(INITIAL_FILES[0].path);
  const [terminal, setTerminal] = useState<string[]>([
    "$ bun run dev",
    "▶ nexus kernel · 0.1.0",
    "✓ orchestrator booted (62ms)",
    "✓ memory store loaded · 12,431 vectors",
    "→ listening on :7070",
  ]);
  const [chat, setChat] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Workspace ready. Open a file, edit it, or describe a change and I'll rewrite the active file with AI." },
  ]);
  const [input, setInput] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const active = useMemo(() => files.find(f => f.path === activePath)!, [files, activePath]);

  const onMount = useCallback((ed: editor.IStandaloneCodeEditor, m: Monaco) => {
    editorRef.current = ed;
    monacoRef.current = m;
    ed.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.KeyS, () => doSave());
    ed.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.KeyF, () => ed.getAction("actions.find")?.run());
  }, []);

  const doSave = () => {
    const ed = editorRef.current; if (!ed) return;
    const content = ed.getValue();
    setFiles(fs => fs.map(f => f.path === activePath ? { ...f, content, dirty: false } : f));
    setTerminal(t => [...t, `✓ saved ${activePath} · ${content.length}b`]);
  };

  const onChange = (v?: string) => {
    setFiles(fs => fs.map(f => f.path === activePath ? { ...f, content: v ?? "", dirty: f.content !== (v ?? "") } : f));
  };

  const newFile = () => {
    const path = prompt("New file path", "src/new.ts");
    if (!path) return;
    const ext = path.split(".").pop() ?? "ts";
    const lang = ext === "md" ? "markdown" : ext === "json" ? "json" : ext === "css" ? "css" : ext === "tsx" || ext === "jsx" ? "typescript" : ext;
    setFiles(fs => [...fs, { path, language: lang, content: "" }]);
    setActivePath(path);
  };

  const triggerSearch = () => editorRef.current?.getAction("actions.find")?.run();

  const aiEdit = async (instruction: string) => {
    if (!instruction.trim() || aiBusy) return;
    setChat(c => [...c, { role: "user", text: instruction }]);
    setInput("");
    setAiBusy(true);
    setTerminal(t => [...t, `→ ai.edit ${activePath} · "${instruction.slice(0, 60)}"`]);
    try {
      const prompt = `You are editing the file \`${active.path}\`.
Apply the user's instruction and return ONLY the full new file contents, no fences, no commentary.

INSTRUCTION:
${instruction}

CURRENT FILE:
${active.content}`;
      const res = await fetch("http://172.236.24.95:3010/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ id: "u", role: "user", parts: [{ type: "text", text: prompt }] }] }),
      });
      if (!res.body) throw new Error("no stream");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "", out = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.type === "text-delta" && typeof evt.delta === "string") out += evt.delta;
          } catch { /* ignore */ }
        }
      }
      const cleaned = out.replace(/^```[\w-]*\n?/, "").replace(/\n?```\s*$/, "").trim();
      if (cleaned) {
        setFiles(fs => fs.map(f => f.path === activePath ? { ...f, content: cleaned, dirty: true } : f));
        editorRef.current?.setValue(cleaned);
        setChat(c => [...c, { role: "ai", text: `Applied edit to \`${active.path}\`. Review and ⌘S to save.` }]);
        setTerminal(t => [...t, `✓ ai.edit applied · +${cleaned.length}b unsaved`]);
      } else {
        setChat(c => [...c, { role: "ai", text: "No changes produced." }]);
      }
    } catch (e) {
      setChat(c => [...c, { role: "ai", text: `Error: ${(e as Error).message}` }]);
    } finally {
      setAiBusy(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); doSave(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePath]);

  const dirtyCount = files.filter(f => f.dirty).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile label="Branch" value="main" tone="cyan" />
        <MetricTile label="Files" value={String(files.length)} tone="violet" />
        <MetricTile label="Unsaved" value={String(dirtyCount)} tone={dirtyCount ? "amber" : "lime"} />
        <MetricTile label="AI" value={aiBusy ? "edit…" : "ready"} tone="cyan" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <GlassPanel className="lg:col-span-2">
          <SectionHeader eyebrow="Explorer" title="Files"
            right={<button onClick={newFile} className="rounded p-1 text-muted-foreground hover:text-neon-cyan"><Plus className="h-3.5 w-3.5" /></button>} />
          <div className="space-y-0.5 p-2 text-xs">
            {files.map(f => (
              <button key={f.path} onClick={() => setActivePath(f.path)}
                className={cn("flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left font-mono",
                  f.path === activePath ? "bg-[color-mix(in_oklab,var(--neon-cyan)_12%,transparent)] text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <FileCode2 className="h-3 w-3 shrink-0 text-neon-cyan" />
                <span className="truncate text-[11px]">{f.path}</span>
                {f.dirty && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--neon-amber)]" />}
              </button>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="flex min-h-[34rem] flex-col lg:col-span-7">
          <SectionHeader eyebrow="Editor" title={active.path + (active.dirty ? " •" : "")}
            right={<div className="flex items-center gap-2">
              <GitBranch className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono text-[10px] text-muted-foreground">main</span>
              <NeonButton variant="ghost" onClick={triggerSearch}><Search className="h-3 w-3" /> Find</NeonButton>
              <NeonButton variant="ghost" onClick={doSave}><Save className="h-3 w-3" /> Save</NeonButton>
              <NeonButton onClick={() => setTerminal(t => [...t, `$ run ${active.path}`, "▶ ok"])}><Play className="h-3 w-3" /> Run</NeonButton>
            </div>} />
          <div className="flex-1">
            <Editor
              height="100%"
              theme="vs-dark"
              path={active.path}
              defaultLanguage={active.language}
              language={active.language}
              value={active.content}
              onChange={onChange}
              onMount={onMount}
              options={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 12, minimap: { enabled: false }, scrollBeyondLastLine: false,
                smoothScrolling: true, padding: { top: 12 }, renderLineHighlight: "gutter",
              }}
            />
          </div>
          <div className="border-t border-border/60">
            <div className="flex items-center gap-2 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"><Terminal className="h-3 w-3" /> terminal</div>
            <div className="max-h-32 space-y-0.5 overflow-y-auto px-4 pb-3 font-mono text-[11px]">
              {terminal.map((l, i) => <div key={i} className={cn(l.startsWith("$") && "text-neon-cyan", l.startsWith("✓") && "text-[color:var(--neon-lime)]", (l.startsWith("→") || l.startsWith("▶")) && "text-neon-violet")}>{l}</div>)}
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="lg:col-span-3">
          <SectionHeader eyebrow="AI Pair" title="Coding copilot"
            right={<div className="flex items-center gap-1.5"><StatusDot tone={aiBusy ? "online" : "idle"} pulse={aiBusy} /><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-neon-cyan">{aiBusy ? "edit" : "live"}</span></div>} />
          <div className="flex h-[28rem] flex-col">
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {chat.map((m, i) => (
                <div key={i} className={cn("rounded border p-2 text-xs",
                  m.role === "user" ? "border-neon-violet/30 bg-[color-mix(in_oklab,var(--neon-violet)_8%,transparent)]" : "border-neon-cyan/30 bg-[color-mix(in_oklab,var(--neon-cyan)_6%,transparent)]")}>
                  <div className="mb-0.5 flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                    {m.role === "ai" && <Sparkles className="h-3 w-3 text-neon-cyan" />} {m.role}
                  </div>
                  {m.text}
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-border/60 p-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && aiEdit(input)}
                placeholder="e.g. add error handling…"
                disabled={aiBusy}
                className="flex-1 rounded border border-border bg-background/50 px-2 py-1.5 text-xs outline-none focus:border-neon-cyan/50 disabled:opacity-60" />
              <NeonButton onClick={() => aiEdit(input)} disabled={aiBusy || !input.trim()}>
                {aiBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              </NeonButton>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}