import { useState, useEffect } from "react";
import { FileText, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Briefs from "../Briefs";

interface StepBlogsArticlesProps {
  projectId: string | null;
  onNext: () => void;
  onPrev: () => void;
}

export default function StepBlogsArticles({ 
  projectId, 
  onNext, 
  onPrev 
}: StepBlogsArticlesProps) {
  const [briefsCreated, setBriefsCreated] = useState(false);

  useEffect(() => {
    if (!projectId) {
      toast.error("Project ID missing. Please complete previous steps first.");
    }
  }, [projectId]);

  const handleBriefsCreated = () => {
    setBriefsCreated(true);
    toast.success("Content briefs created!");
    
    setTimeout(() => {
      onNext();
    }, 1500);
  };

  // Show error if no projectId
  if (!projectId) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-[#0B1F3B]">Missing Project Information</h2>
        <p className="text-[#5B6B8A]">
          Please go back and complete the previous steps first.
        </p>
        <Button onClick={onPrev} variant="outline">
          ← Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 mx-auto">
      <div className="text-center mb-12">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#1B64F2] to-[#3EF0C1] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <FileText className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#0B1F3B] to-[#1B64F2] bg-clip-text text-transparent mb-6">
          Create Your First Blogs & Articles
        </h1>
        <p className="text-xl text-[#5B6B8A] max-w-2xl mx-auto">
          Generate AI-powered content briefs optimized for your keywords and audience
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-[#E5E7EB]/50 p-8 shadow-2xl">
        <Briefs 
          projectId={projectId}
          onboardingMode={true}
          onBriefsCreated={handleBriefsCreated}
        />
      </div>

      {briefsCreated && (
        <div className="text-center pt-8">
          <div className="inline-flex items-center gap-2 bg-[#3EF0C1]/20 text-[#10B981] px-8 py-4 rounded-2xl font-bold text-lg shadow-lg">
            <Sparkles className="w-5 h-5 animate-spin" />
            Content briefs ready! Moving to integrations...
          </div>
        </div>
      )}
    </div>
  );
}
