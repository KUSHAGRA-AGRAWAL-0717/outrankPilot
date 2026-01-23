import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
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
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import logo from "../../../public/logo2.jpeg";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Keywords", href: "/keywords", icon: Search },
  { name: "Content Briefs", href: "/briefs", icon: FileText },
  { name: "Content Planner", href: "/calendar", icon: Calendar },
  { name: "Competitor Analysis", href: "/competitor-analysis", icon: Globe },
  { name: "Autopilot", href: "/autopilot", icon: Zap },
  { name: "Integrations", href: "/integrations", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { currentProject, projects, setCurrentProject } = useApp();
  const [projectsOpen, setProjectsOpen] = useState(false);
  const { access, loading, getLimitInfo } = useFeatureAccess();

  // Get limit info for display
  const articleInfo = getLimitInfo("articles");
  const projectInfo = getLimitInfo("projects");
  const keywordInfo = getLimitInfo("keywords");

  return (
    <aside className="flex h-screen w-64 flex-col bg-white border-r border-[#8A94B3]/30">
      {/* Logo */}
      <div className="flex h-20 items-center gap-2 px-6 border-b border-[#8A94B3]/30">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFD84D]">
          <img
            src={logo}
            alt="OutrankPilot Logo"
            className="h-10 w-10 rounded-full"
          />
        </div>

        <span className="text-xl font-bold text-[#0B1F3B]">OutrankPilot</span>
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
              projectsOpen && "rotate-180",
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
                        : "text-[#0B1F3B] hover:bg-[#F6F8FC]",
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
                  : "text-[#0B1F3B] hover:bg-[#F6F8FC]",
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
        {loading ? (
          <div className="rounded-xl bg-[#F6F8FC] p-4 border border-[#8A94B3]/30">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : access ? (
          <div className="space-y-3">
            {/* Plan Badge */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#5B6B8A]">
                Current Plan
              </span>
              <span
                className={cn(
                  "px-2 py-1 rounded-full text-xs font-bold",
                  access.plan === "free"
                    ? "bg-gray-100 text-gray-700"
                    : "bg-gradient-to-r from-[#FFD84D] to-yellow-400 text-[#0B1F3B]",
                )}
              >
                {access.plan.charAt(0).toUpperCase() + access.plan.slice(1)}
              </span>
            </div>

            {/* Articles Usage */}
            <div className="rounded-xl bg-[#F6F8FC] p-4 border border-[#8A94B3]/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#5B6B8A]">
                  Monthly Articles
                </span>
                <span className="text-xs font-bold text-[#0B1F3B]">
                  {articleInfo.isUnlimited
                    ? `${articleInfo.current}/∞`
                    : `${articleInfo.current}/${articleInfo.max}`}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#8A94B3]/20 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    articleInfo.percentage >= 90
                      ? "bg-red-500"
                      : articleInfo.percentage >= 70
                        ? "bg-yellow-500"
                        : "bg-[#1B64F2]",
                  )}
                  style={{
                    width: articleInfo.isUnlimited
                      ? "0%"
                      : `${Math.min(articleInfo.percentage, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Projects Usage */}
            <div className="rounded-xl bg-[#F6F8FC] p-4 border border-[#8A94B3]/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#5B6B8A]">
                  Projects
                </span>
                <span className="text-xs font-bold text-[#0B1F3B]">
                  {projectInfo.isUnlimited
                    ? `${projectInfo.current}/∞`
                    : `${projectInfo.current}/${projectInfo.max}`}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#8A94B3]/20 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    projectInfo.percentage >= 90
                      ? "bg-red-500"
                      : projectInfo.percentage >= 70
                        ? "bg-yellow-500"
                        : "bg-[#1B64F2]",
                  )}
                  style={{
                    width: projectInfo.isUnlimited
                      ? "0%"
                      : `${Math.min(projectInfo.percentage, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Keywords Usage */}
            <div className="rounded-xl bg-[#F6F8FC] p-4 border border-[#8A94B3]/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#5B6B8A]">
                  Keywords
                </span>
                <span className="text-xs font-bold text-[#0B1F3B]">
                  {keywordInfo.isUnlimited
                    ? `${keywordInfo.current}/∞`
                    : `${keywordInfo.current}/${keywordInfo.max}`}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#8A94B3]/20 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    keywordInfo.percentage >= 90
                      ? "bg-red-500"
                      : keywordInfo.percentage >= 70
                        ? "bg-yellow-500"
                        : "bg-[#1B64F2]",
                  )}
                  style={{
                    width: keywordInfo.isUnlimited
                      ? "0%"
                      : `${Math.min(keywordInfo.percentage, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Upgrade Link for Free Users */}
            {access.plan === "free" && (
              <Link
                to="/plans"
                className="block w-full text-center px-4 py-2 bg-gradient-to-r from-[#FFD84D] to-yellow-400 hover:from-yellow-400 hover:to-[#FFD84D] text-[#0B1F3B] rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg"
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Upgrade Plan
                </div>
              </Link>
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
