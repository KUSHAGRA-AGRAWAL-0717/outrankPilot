import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Sparkles } from "lucide-react";
import Briefs from "../Briefs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StepBlogsArticles({ projectId, onNext, onPrev }) {
  const [briefsCreated, setBriefsCreated] = useState(false);

  return (
    <div className="max-w-4xl space-y-8 mx-auto">
      <div className="text-center mb-12">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#1B64F2] to-[#3EF0C1] rounded-2xl flex items-center justify-center mb-6">
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
          onBriefsCreated={() => {
            setBriefsCreated(true);
            setTimeout(() => onNext({}), 1500);
          }}
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
