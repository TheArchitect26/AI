import {
  LayoutDashboard, MessageSquare, Mic, Network, LineChart, Radar, Zap, FlaskConical,
  Brain, Database, BookOpen, Workflow, Activity, Vault, ScrollText, KeyRound, Cpu,
  ListChecks, ShieldCheck, Settings, Code2, Atom, Search,
} from "lucide-react";

export const NAV = [
  { to: "/", label: "Command Center", icon: LayoutDashboard, group: "Core" },
  { to: "/chat", label: "AI Chat", icon: MessageSquare, group: "Core" },
  { to: "/voice", label: "Voice Console", icon: Mic, group: "Core" },
  { to: "/agents", label: "Agent Control", icon: Network, group: "Core" },
  { to: "/workspace", label: "Code Workspace", icon: Code2, group: "Core" },

  { to: "/trading", label: "Trading Intel", icon: LineChart, group: "Markets" },
  { to: "/scanner", label: "Market Scanner", icon: Radar, group: "Markets" },
  { to: "/signals", label: "Signal Engine", icon: Zap, group: "Markets" },
  { to: "/strategy", label: "Strategy Lab", icon: FlaskConical, group: "Markets" },

  { to: "/learning", label: "AI Learning", icon: Brain, group: "Intelligence" },
  { to: "/memory", label: "Memory System", icon: Database, group: "Intelligence" },
  { to: "/research", label: "Research Hub", icon: BookOpen, group: "Intelligence" },
  { to: "/investigate", label: "Investigation", icon: Search, group: "Intelligence" },
  { to: "/lab", label: "Science Lab", icon: Atom, group: "Intelligence" },
  { to: "/automation", label: "Automation", icon: Workflow, group: "Intelligence" },

  { to: "/infra", label: "Infrastructure", icon: Activity, group: "Ops" },
  { to: "/vault", label: "Knowledge Vault", icon: Vault, group: "Ops" },
  { to: "/logs", label: "System Logs", icon: ScrollText, group: "Ops" },
  { to: "/api", label: "API Manager", icon: KeyRound, group: "Ops" },
  { to: "/models", label: "Model Manager", icon: Cpu, group: "Ops" },
  { to: "/tasks", label: "Task Orchestrator", icon: ListChecks, group: "Ops" },
  { to: "/security", label: "Security Center", icon: ShieldCheck, group: "Ops" },
  { to: "/settings", label: "Settings", icon: Settings, group: "Ops" },
] as const;

export type NavItem = typeof NAV[number];
