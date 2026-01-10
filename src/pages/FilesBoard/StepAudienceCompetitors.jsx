import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Target, Check } from "lucide-react";
import Keywords from "../Keywords";
import Competitors from "../Competitors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StepAudienceCompetitors({ projectId, onNext, onPrev }) {
  const [keywordsSubmitted, setKeywordsSubmitted] = useState(false);
  const [competitorsSubmitted, setCompetitorsSubmitted] = useState(false);

  const handleKeywordsSubmit = () => {
    setKeywordsSubmitted(true);
  };

  const handleCompetitorsSubmit = () => {
    setCompetitorsSubmitted(true);
  };

  const isReadyForNext = keywordsSubmitted && competitorsSubmitted && projectId;

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
        {/* Keywords Section - First Row */}
        <Card className="border-[#E5E7EB] shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4 border-b border-[#E5E7EB]">
            <CardTitle className="flex items-center gap-3 text-[#0B1F3B] text-lg">
              <div className="w-10 h-10 rounded-lg bg-[#1B64F2]/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-[#1B64F2]" />
              </div>
              Target Keywords
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Keywords 
              projectId={projectId}
              onSubmit={handleKeywordsSubmit}
              onboardingMode={true}
            />
            {keywordsSubmitted && (
              <div className="mt-4 p-3 bg-[#3EF0C1]/20 border border-[#10B981]/30 rounded-lg flex items-center gap-2 text-[#10B981] text-sm font-semibold">
                <Check className="w-4 h-4" />
                Keywords added successfully
              </div>
            )}
          </CardContent>
        </Card>

        {/* Competitors Section - Second Row */}
        <Card className="border-[#E5E7EB] shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4 border-b border-[#E5E7EB]">
            <CardTitle className="flex items-center gap-3 text-[#0B1F3B] text-lg">
              <div className="w-10 h-10 rounded-lg bg-[#1B64F2]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#1B64F2]" />
              </div>
              Competitors
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Competitors 
              projectId={projectId}
              onSubmit={handleCompetitorsSubmit}
              onboardingMode={true}
            />
            {competitorsSubmitted && (
              <div className="mt-4 p-3 bg-[#3EF0C1]/20 border border-[#10B981]/30 rounded-lg flex items-center gap-2 text-[#10B981] text-sm font-semibold">
                <Check className="w-4 h-4" />
                Competitors added successfully
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pt-6">
        <Button 
          onClick={onNext}
          disabled={!isReadyForNext}
          size="lg"
          className="bg-[#1B64F2] hover:bg-[#1246C9] text-white font-semibold px-10 py-6 text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
        >
          {isReadyForNext ? (
            <>
              Continue to Content
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          ) : (
            "Complete both sections to continue"
          )}
        </Button>
      </div>
    </div>
  );
}