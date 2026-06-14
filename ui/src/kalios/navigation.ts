import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bot,
  Boxes,
  Brain,
  CheckSquare,
  CircleGauge,
  FolderKanban,
  Network,
  PlayCircle,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

export interface KaliNavigationItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: string;
}

export const kaliPrimaryNavigation: KaliNavigationItem[] = [
  { id: "overview", label: "Overview", href: "/dashboard", icon: CircleGauge },
  { id: "projects", label: "Projects", href: "/projects", icon: FolderKanban },
  { id: "tasks", label: "Tasks", href: "/issues", icon: CheckSquare, badgeKey: "tasksAttention" },
  { id: "workers", label: "Workers", href: "/agents/all", icon: Bot },
  { id: "teams", label: "Teams", href: "/org", icon: Users },
  { id: "runs", label: "Runs", href: "/runs", icon: PlayCircle, badgeKey: "activeRuns" },
  { id: "knowledge", label: "KALI Brain", href: "/knowledge", icon: Brain },
  { id: "connections", label: "Connections", href: "/connections", icon: Network },
  { id: "runtime", label: "Runtime", href: "/runtime", icon: Boxes },
  {
    id: "approvals",
    label: "Approvals",
    href: "/approvals/pending",
    icon: ShieldCheck,
    badgeKey: "approvals",
  },
  { id: "activity", label: "Activity", href: "/activity", icon: Activity },
];

export const kaliUtilityNavigation: KaliNavigationItem[] = [
  { id: "settings", label: "Settings", href: "/company/settings", icon: Settings },
];
