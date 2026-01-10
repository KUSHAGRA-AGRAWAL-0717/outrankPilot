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
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import logo from "../../../public/logo2.jpeg";
import Autopilot from "@/pages/Autopilot";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Keywords", href: "/keywords", icon: Search },
  { name: "Content Briefs", href: "/briefs", icon: FileText },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Competitor Analysis", href: "/competitor-analysis", icon: Globe },
  { name: "Autopilot", href: "/autopilot", icon: Zap },
  { name: "Integrations", href: "/integrations", icon: Settings },
];
  
export function Sidebar() {
  const location = useLocation();
  const { currentProject, projects, setCurrentProject } = useApp();
  const [projectsOpen, setProjectsOpen] = useState(false);

  return (
    <aside className="flex h-screen w-64 flex-col bg-white border-r border-[#8A94B3]/30">
      {/* Logo */}
      <div className="flex h-20 items-center gap-2 px-6 border-b border-[#8A94B3]/30">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFD84D]">
          <img src={logo} alt="OutrankPilot Logo" className="h-10 w-10 rounded-full" />
        </div>
        
        <span className="text-xl font-bold text-[#0B1F3B]">
          OutrankPilot
        </span>
      </div>

      {/* Project Switcher */}
      <div className="p-4">
        <button
          onClick={() => setProjectsOpen(!projectsOpen)}
          className="flex w-full items-center justify-between rounded-xl bg-[#F6F8FC] p-4 transition-all hover:bg-[#F6F8FC]/80 border border-[#8A94B3]/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B64F2]/10">
              {currentProject ? (
                <Globe className="h-5 w-5 text-[#1B64F2]" />
              ) : (
                <FolderOpen className="h-5 w-5 text-[#5B6B8A]" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[#0B1F3B]">
                {currentProject?.name || "No Project"}
              </p>
              <p className="text-xs text-[#5B6B8A]">
                {currentProject?.domain || "Create your first project"}
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-[#5B6B8A] transition-transform duration-200",
              projectsOpen && "rotate-180"
            )}
          />
        </button>

        {projectsOpen && (
          <div className="mt-2 space-y-1 rounded-xl border border-[#8A94B3]/30 bg-white p-2 shadow-lg animate-scale-in">
            {projects.length === 0 ? (
              <p className="px-3 py-4 text-sm text-[#5B6B8A] text-center">
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
                      "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all",
                      currentProject?.id === project.id
                        ? "bg-[#1B64F2]/10 text-[#1B64F2]"
                        : "text-[#0B1F3B] hover:bg-[#F6F8FC]"
                    )}
                  >
                    <Globe className="h-4 w-4" />
                    <div className="flex-1 truncate">
                      <span className="text-sm font-medium block truncate">
                        {project.name}
                      </span>
                      {project.domain && (
                        <span className="text-xs text-[#5B6B8A] truncate block">
                          {project.domain}
                        </span>
                      )}
                    </div>
                  </button>
                ))
            )}
            <Link to="/projects/new">
              <button className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-2.5 text-sm font-medium text-[#1B64F2] hover:bg-[#F6F8FC] rounded-lg transition-all border border-[#1B64F2]/30">
                <Plus className="h-4 w-4" />
                Add Project
              </button>
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
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-[#FFD84D] text-[#0B1F3B] shadow-md"
                  : "text-[#0B1F3B] hover:bg-[#F6F8FC]"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Usage Stats */}
      <div className="p-4 border-t border-[#8A94B3]/30">
        <div className="rounded-xl bg-[#F6F8FC] p-4 border border-[#8A94B3]/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#5B6B8A]">
              Monthly Briefs
            </span>
            <span className="text-xs font-bold text-[#0B1F3B]">
              0/50
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#8A94B3]/20 overflow-hidden">
            <div className="h-full w-0 rounded-full bg-[#1B64F2] transition-all" />
          </div>
        </div>
      </div>
    </aside>
  );
}