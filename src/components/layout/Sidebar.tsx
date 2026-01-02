import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  FileText,
  Calendar,
  Settings,
  ChevronDown,
  Plus,
  Globe,
  Sparkles,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Keywords", href: "/keywords", icon: Search },
  { name: "Content Briefs", href: "/briefs", icon: FileText },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Competitor Analysis", href: "/competitor-analysis", icon: Globe },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { currentProject, projects, setCurrentProject } = useApp();
  const [projectsOpen, setProjectsOpen] = useState(false);

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">
         OutrankPilot
        </span>
      </div>

      {/* Project Switcher */}
      <div className="p-4">
        <button
          onClick={() => setProjectsOpen(!projectsOpen)}
          className="flex w-full items-center justify-between rounded-lg bg-sidebar-accent p-3 transition-colors hover:bg-sidebar-accent/80"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              {currentProject ? (
                <Globe className="h-4 w-4 text-primary" />
              ) : (
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-sidebar-foreground">
                {currentProject?.name || "No Project"}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentProject?.domain || "Create your first project"}
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              projectsOpen && "rotate-180"
            )}
          />
        </button>

        {projectsOpen && (
          <div className="mt-2 space-y-1 rounded-lg border border-sidebar-border bg-card p-2 animate-scale-in">
            {projects.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground text-center">
                No projects yet
              </p>
            ) : (
              projects
                .filter((project) => !project.disabled)
                .map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setCurrentProject(project);
                      setProjectsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors",
                      currentProject?.id === project.id
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <Globe className="h-4 w-4" />
                    <div className="flex-1 truncate">
                      <span className="text-sm block truncate">
                        {project.name}
                      </span>
                      {project.domain && (
                        <span className="text-xs text-muted-foreground truncate block">
                          {project.domain}
                        </span>
                      )}
                    </div>
                  </button>
                ))
            )}
            <Link to="/projects/new">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 mt-2"
              >
                <Plus className="h-4 w-4" />
                Add Project
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Usage Stats */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="rounded-lg bg-sidebar-accent p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              Monthly Briefs
            </span>
            <span className="text-xs font-medium text-sidebar-foreground">
              0/50
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-sidebar-border overflow-hidden">
            <div className="h-full w-0 rounded-full bg-gradient-primary" />
          </div>
        </div>
      </div>
    </aside>
  );
}
