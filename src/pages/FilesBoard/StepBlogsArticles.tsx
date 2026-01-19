import { useState, useEffect } from "react";
import { FileText, Sparkles, AlertCircle, ArrowRight, CheckCircle } from "lucide-react";
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
    // ✅ REMOVED: Automatic navigation with setTimeout
  };

  const handleContinue = () => {
    onNext();
  };

  if (!projectId) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-[#0B1F3B]">Missing Project Information</h2>
        <p className="text-[#5B6B8A]">
          Please go back and complete the previous steps first.
        </p>
        <Button 
          onClick={onPrev} 
          variant="outline"
          className="border-2 border-[#E5E7EB] hover:border-[#1B64F2] hover:bg-[#1B64F2]/5 text-[#0B1F3B] font-semibold"
        >
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
        <h1 className="text-4xl md:text-5xl font-bold text-[#0B1F3B] mb-4">
          Create Your First Blogs & Articles
        </h1>
        <p className="text-xl text-[#5B6B8A] max-w-2xl mx-auto">
          Generate AI-powered content briefs optimized for your keywords and audience
        </p>
      </div>

      <div className="bg-white rounded-3xl border-2 border-[#E5E7EB] p-8 shadow-xl">
        <Briefs 
          projectId={projectId}
          onboardingMode={true}
          onBriefsCreated={handleBriefsCreated}
        />
      </div>

      {/* ✅ NEW: Success message with manual continue button */}
      {briefsCreated && (
        <div className="space-y-6 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#10B981]/20 to-[#3EF0C1]/20 border-2 border-[#10B981]/30 text-[#10B981] px-8 py-4 rounded-2xl font-bold text-lg shadow-lg mb-6">
              <CheckCircle className="w-6 h-6" />
              Content briefs ready!
            </div>
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={handleContinue}
              size="lg"
              className="bg-gradient-to-r from-[#1B64F2] to-[#1246C9] hover:from-[#1246C9] hover:to-[#0F3BA0] text-white font-semibold px-10 py-6 text-base shadow-lg hover:shadow-xl transition-all rounded-xl"
            >
              Continue to Integrations
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
