import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Target, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Keywords from "../Keywords";
import Competitors from "../Competitors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StepAudienceCompetitorsProps {
  projectId: string | null;
  onNext: () => void;
  onPrev: () => void;
}

export default function StepAudienceCompetitors({ 
  projectId, 
  onNext, 
  onPrev 
}: StepAudienceCompetitorsProps) {
  const [keywordsSubmitted, setKeywordsSubmitted] = useState(false);
  const [competitorsSubmitted, setCompetitorsSubmitted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Validate projectId
    if (!projectId) {
      toast.error("Project ID missing. Please complete step 1 first.");
      setChecking(false);
      return;
    }

    // Check if keywords and competitors already exist
    checkExistingData();
  }, [projectId]);

  const checkExistingData = async () => {
    if (!projectId) return;

    try {
      // Check for existing keywords
      const { data: keywordsData, error: keywordsError } = await supabase
        .from("keywords")
        .select("id")
        .eq("project_id", projectId)
        .limit(1);

      if (!keywordsError && keywordsData && keywordsData.length > 0) {
        setKeywordsSubmitted(true);
      }

      // Check for existing competitors
      const { data: competitorsData, error: competitorsError } = await supabase
        .from("competitors")
        .select("id")
        .eq("project_id", projectId)
        .limit(1);

      if (!competitorsError && competitorsData && competitorsData.length > 0) {
        setCompetitorsSubmitted(true);
      }
    } catch (error) {
      console.error("Error checking existing data:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleKeywordsSubmit = () => {
    if (!keywordsSubmitted) {
      setKeywordsSubmitted(true);
      toast.success("✅ Keywords section completed!");
    }
  };

  const handleCompetitorsSubmit = () => {
    if (!competitorsSubmitted) {
      setCompetitorsSubmitted(true);
      toast.success("✅ Competitors section completed!");
    }
  };

  const handleNext = () => {
    if (!projectId) {
      toast.error("Project ID is missing!");
      return;
    }
    if (!keywordsSubmitted || !competitorsSubmitted) {
      toast.error("Please add at least one keyword and one competitor before continuing");
      return;
    }
    onNext();
  };

  const isReadyForNext = keywordsSubmitted && competitorsSubmitted && projectId;

  // Show error if no projectId
  if (!projectId) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-[#0B1F3B]">Missing Project Information</h2>
        <p className="text-[#5B6B8A]">
          Please go back and complete the project creation step first.
        </p>
        <Button onClick={onPrev} variant="outline">
          ← Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#1B64F2] to-[#3EF0C1] rounded-2xl flex items-center justify-center shadow-lg">
          <Users className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0B1F3B] mb-4 leading-tight">
            Define Your Audience & Competitors
          </h1>
          <p className="text-lg text-[#5B6B8A] max-w-2xl mx-auto">
            Add your target keywords and top competitors to analyze opportunities
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Keywords Section */}
        <Card className="border-[#E5E7EB] shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4 border-b border-[#E5E7EB] flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-[#0B1F3B] text-lg">
              <div className="w-10 h-10 rounded-lg bg-[#1B64F2]/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-[#1B64F2]" />
              </div>
              Target Keywords
            </CardTitle>
            {keywordsSubmitted && (
              <Check className="w-5 h-5 text-[#10B981]" />
            )}
          </CardHeader>
          <CardContent className="pt-6">
            <Keywords 
              projectId={projectId}
              onSubmit={handleKeywordsSubmit}
              onboardingMode={true}
            />
          </CardContent>
        </Card>

        {/* Competitors Section */}
        <Card className="border-[#E5E7EB] shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4 border-b border-[#E5E7EB] flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-[#0B1F3B] text-lg">
              <div className="w-10 h-10 rounded-lg bg-[#1B64F2]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#1B64F2]" />
              </div>
              Competitors
            </CardTitle>
            {competitorsSubmitted && (
              <Check className="w-5 h-5 text-[#10B981]" />
            )}
          </CardHeader>
          <CardContent className="pt-6">
            <Competitors 
              projectId={projectId}
              onSubmit={handleCompetitorsSubmit}
              onboardingMode={true}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pt-6">
        <Button 
          onClick={handleNext}
          disabled={!isReadyForNext || checking}
          size="lg"
          className="bg-[#1B64F2] hover:bg-[#1246C9] text-white font-semibold px-10 py-6 text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
        >
          {checking ? (
            "Checking..."
          ) : isReadyForNext ? (
            <>
              Continue to Content
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          ) : (
            "Add at least one keyword and competitor"
          )}
        </Button>
      </div>
    </div>
  );
}
