import {
  Inbox,
  CircleDot,
  Target,
  LayoutDashboard,
  DollarSign,
  History,
  Search,
  SquarePen,
  Network,
  Boxes,
  Repeat,
  GitBranch,
  Package,
  Settings,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  MessagesSquare,
  Bot,
  ShieldCheck,
  PlayCircle,
  MonitorCog,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { NavLink } from "@/lib/router";
import { SidebarSection } from "./SidebarSection";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarAgents } from "./SidebarAgents";
import { SidebarProjects } from "./SidebarProjects";
import { useDialogActions } from "../context/DialogContext";
import { useCompany } from "../context/CompanyContext";
import { useSidebar } from "../context/SidebarContext";
import { heartbeatsApi } from "../api/heartbeats";
import { instanceSettingsApi } from "../api/instanceSettings";
import { queryKeys } from "../lib/queryKeys";
import { useInboxBadge } from "../hooks/useInboxBadge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SIDEBAR_RAIL_HIDDEN_LABEL } from "../lib/utils";
import { PluginSlotOutlet } from "@/plugins/slots";
import { PluginLauncherOutlet } from "@/plugins/launchers";
import { SidebarCompanyMenu } from "./SidebarCompanyMenu";

export function Sidebar() {
  const { openNewIssue } = useDialogActions();
  const { selectedCompanyId, selectedCompany } = useCompany();
  const { isMobile, collapsed, collapseLocked, peeking, toggleCollapsed, setCollapsed } = useSidebar();
  const rail = collapsed && !peeking;
  const inboxBadge = useInboxBadge(selectedCompanyId);

  const { data: experimentalSettings } = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
  });

  const { data: liveRuns } = useQuery({
    queryKey: queryKeys.liveRuns(selectedCompanyId!),
    queryFn: () => heartbeatsApi.liveRunsForCompany(selectedCompanyId!),
    enabled: !!selectedCompanyId,
    refetchInterval: 10_000,
  });

  const liveRunCount = liveRuns?.length ?? 0;
  const showWorkspacesLink = experimentalSettings?.enableIsolatedWorkspaces === true;
  const conferenceRoomChatEnabled = experimentalSettings?.enableConferenceRoomChat === true;

  const pluginContext = {
    companyId: selectedCompanyId,
    companyPrefix: selectedCompany?.issuePrefix ?? null,
  };

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-border bg-background">
      <div className="flex h-12 shrink-0 items-center gap-1 px-3">
        <SidebarCompanyMenu />
        {!rail ? (
          <>
            <Button
              asChild
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground"
              aria-label="Open search"
              title="Open search"
            >
              <NavLink to="/search">
                <Search className="h-4 w-4" />
              </NavLink>
            </Button>
            {!isMobile && !collapseLocked ? (
              peeking ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground"
                  aria-label="Keep sidebar expanded"
                  title="Keep sidebar expanded"
                  onClick={() => setCollapsed(false)}
                >
                  <Pin className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground"
                  aria-expanded={!collapsed}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  onClick={() => toggleCollapsed()}
                >
                  {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </Button>
              )
            ) : null}
          </>
        ) : null}
      </div>

      {!rail ? (
        <div className="mx-3 mb-2 rounded-md border border-border bg-muted/35 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold tracking-[0.18em] text-foreground">KALI OS</span>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Hermes control plane
            </span>
          </div>
        </div>
      ) : null}

      <nav className="scrollbar-auto-hide flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-2 pointer-coarse:gap-3">
        <div className="flex flex-col gap-0.5">
          {(() => {
            const newTaskButton = (
              <button
                onClick={() => openNewIssue()}
                data-slot="icon-button"
                aria-label={rail ? "New Task" : undefined}
                className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-foreground/80 transition-colors hover:bg-accent/50 hover:text-foreground pointer-coarse:py-1.5"
              >
                <SquarePen className="h-4 w-4 shrink-0" />
                <span className={rail ? SIDEBAR_RAIL_HIDDEN_LABEL : "truncate"}>New Task</span>
              </button>
            );

            return rail ? (
              <Tooltip>
                <TooltipTrigger asChild>{newTaskButton}</TooltipTrigger>
                <TooltipContent side="right">New Task</TooltipContent>
              </Tooltip>
            ) : (
              newTaskButton
            );
          })()}

          <SidebarNavItem to="/dashboard" label="Overview" icon={LayoutDashboard} />
          <SidebarNavItem
            to="/inbox"
            label="Inbox"
            icon={Inbox}
            badge={inboxBadge.inbox}
            badgeLabel="unread"
            badgeTone={inboxBadge.failedRuns > 0 ? "danger" : "default"}
            alert={inboxBadge.failedRuns > 0}
          />
          {conferenceRoomChatEnabled ? (
            <SidebarNavItem to="/board-chat" label="Project Manager" icon={MessagesSquare} />
          ) : null}
        </div>

        <SidebarSection label="Operate">
          <SidebarNavItem to="/projects" label="Projects" icon={FolderOpen} />
          <SidebarNavItem to="/issues" label="Tasks" icon={CircleDot} />
          <SidebarNavItem to="/agents/all" label="Workers" icon={Bot} />
          <SidebarNavItem to="/dashboard/live" label="Control Plane" icon={PlayCircle} liveCount={liveRunCount} />
          <SidebarNavItem to="/routines" label="Routines" icon={Repeat} />
          <SidebarNavItem to="/goals" label="Goals" icon={Target} />
        </SidebarSection>

        <SidebarProjects />
        <SidebarAgents streamlined />

        <SidebarSection label="Knowledge">
          <SidebarNavItem to="/artifacts" label="KALI Brain" icon={Package} />
        </SidebarSection>

        <SidebarSection label="System">
          <SidebarNavItem to="/system" label="System" icon={MonitorCog} />
          <SidebarNavItem to="/company/settings/instance/adapters" label="Connections" icon={Boxes} />
          <SidebarNavItem to="/workspaces" label="Runtime" icon={GitBranch} />
          <SidebarNavItem to="/approvals/pending" label="Approvals" icon={ShieldCheck} />
          <SidebarNavItem to="/org" label="Teams" icon={Network} />
          <SidebarNavItem to="/skills" label="Skills" icon={Boxes} />
          <SidebarNavItem to="/costs" label="Costs" icon={DollarSign} />
          <SidebarNavItem to="/activity" label="Activity" icon={History} />
          <SidebarNavItem to="/company/settings" label="Settings" icon={Settings} />
        </SidebarSection>

        {showWorkspacesLink ? null : (
          <p className={rail ? SIDEBAR_RAIL_HIDDEN_LABEL : "px-3 text-[10px] leading-4 text-muted-foreground"}>
            Runtime workspaces can be enabled in experimental settings.
          </p>
        )}

        <PluginSlotOutlet
          slotTypes={["sidebar"]}
          context={pluginContext}
          className="flex flex-col gap-0.5"
          itemClassName="text-[13px] font-medium"
          missingBehavior="placeholder"
        />
        <PluginLauncherOutlet
          placementZones={["sidebar"]}
          context={pluginContext}
          className="flex flex-col gap-0.5"
          itemClassName="text-[13px] font-medium"
        />
        <PluginSlotOutlet
          slotTypes={["sidebarPanel"]}
          context={pluginContext}
          className="flex flex-col gap-3"
          itemClassName="rounded-lg border border-border p-3"
          missingBehavior="placeholder"
        />
      </nav>
    </aside>
  );
}
