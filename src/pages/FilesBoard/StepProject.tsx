import { useState, useEffect } from "react";
import { Globe, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import NewProject from "../NewProject";
import { supabase } from "@/integrations/supabase/client";

interface StepProjectProps {
  onNext: (projectId: string) => void;
  existingProjectId: string | null;
}

export default function StepProject({ onNext, existingProjectId }: StepProjectProps) {
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectCreated, setProjectCreated] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);

  useEffect(() => {
    // Check if project already exists
    if (existingProjectId) {
      loadExistingProject();
    }
  }, [existingProjectId]);

  const loadExistingProject = async () => {
    if (!existingProjectId) return;

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", existingProjectId)
        .single();

      if (!error && data) {
        setProjectData(data);
        setProjectCreated(true);
      }
    } catch (error) {
      console.error("Load project error:", error);
    }
  };

  const handleProjectCreated = async (projectId: string) => {
    setProjectCreated(true);
    setProjectLoading(false);
    toast.success("✅ Project created successfully!");
    
    // Wait a moment before moving to next step
    setTimeout(() => {
      onNext(projectId);
    }, 1500);
  };

  const handleContinue = () => {
    if (existingProjectId) {
      onNext(existingProjectId);
    }
  };

  // If project already exists, show continue option
  if (projectCreated && existingProjectId) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-[#10B981] to-[#3EF0C1] rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#0B1F3B] via-[#1B64F2] to-[#3EF0C1] bg-clip-text text-transparent mb-6 leading-tight">
            Project Already Created
          </h1>
          <p className="text-xl text-[#5B6B8A] max-w-md mx-auto leading-relaxed">
            {projectData?.name || "Your project"} is ready to go!
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-[#E5E7EB]/50 p-8 shadow-2xl">
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-[#5B6B8A]">Project Name:</span>
              <span className="font-medium text-[#0B1F3B]">{projectData?.name}</span>
            </div>
            {projectData?.business_url && (
              <div className="flex justify-between text-sm">
                <span className="text-[#5B6B8A]">Website:</span>
                <span className="font-medium text-[#0B1F3B]">{projectData.business_url}</span>
              </div>
            )}
          </div>

          <Button
            onClick={handleContinue}
            className="w-full bg-[#1B64F2] hover:bg-[#1246C9] text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all rounded-xl"
          >
            Continue to Next Step →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
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

      {projectCreated && !existingProjectId && (
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
