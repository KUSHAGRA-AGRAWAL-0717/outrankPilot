import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import NewProject from "../NewProject";

export default function StepProject({ onNext, setProjectId }) {
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectCreated, setProjectCreated] = useState(false);

  const handleProjectCreated = async (projectId) => {
    setProjectId(projectId);
    setProjectCreated(true);
    setProjectLoading(false);
    toast.success("Project created successfully!");
    setTimeout(() => onNext(), 1000);
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div className="text-center">
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-[#1B64F2] to-[#3EF0C1] rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
          <Globe className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#0B1F3B] via-[#1B64F2] to-[#3EF0C1] bg-clip-text text-transparent mb-6 leading-tight">
          Create Your First Project
        </h1>
        <p className="text-xl text-[#5B6B8A] max-w-md mx-auto leading-relaxed">
          Enter your website domain to get started with AI-powered SEO optimization
        </p>
        <p className="text-sm text-[#8A94B3] mt-2">
          We'll analyze your site and auto-fill project details for you
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-[#E5E7EB]/50 p-8 shadow-2xl">
       <NewProject 
  onProjectCreated={handleProjectCreated}
  onboardingMode={true}
  loading={projectLoading}
  onLoadingChange={setProjectLoading}
/>

      </div>

      {projectCreated && (
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-2 bg-[#3EF0C1]/20 text-[#10B981] px-6 py-3 rounded-2xl font-medium">
            <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
            Project created! Moving to next step...
          </div>
        </div>
      )}
    </div>
  );
}
