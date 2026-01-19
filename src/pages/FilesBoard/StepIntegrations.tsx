import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Link, Zap, CheckCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ConnectNotion from "../../components/ConnectNotion";
import ConnectWordPress from "../../components/ConnectWordPress";

interface StepIntegrationsProps {
  projectId: string | null;
  onNext: () => void;
  onPrev: () => void;
}

export default function StepIntegrations({ 
  projectId, 
  onNext, 
  onPrev 
}: StepIntegrationsProps) {
  const navigate = useNavigate();
  const [notionConnected, setNotionConnected] = useState(false);
  const [wordpressConnected, setWordpressConnected] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const handleSkip = async () => {
    setSkipping(true);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error("Authentication error");
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          onboarding_completed: true,
          onboarding_step: 4
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error completing onboarding:", updateError);
        toast.error("Failed to complete onboarding");
        return;
      }

      toast.success("🎉 Setup skipped! You can connect integrations later.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Skip error:", error);
      toast.error("An error occurred");
    } finally {
      setSkipping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#1B64F2] to-[#3EF0C1] rounded-2xl flex items-center justify-center shadow-lg">
          <Zap className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0B1F3B] mb-3 leading-tight">
            Connect Your Tools
          </h1>
          <p className="text-lg text-[#5B6B8A] max-w-2xl mx-auto mb-2">
            Connect your publishing platforms to automate content workflow
          </p>
          <p className="text-sm text-[#8A94B3]">
            Optional - You can skip this step and set up later
          </p>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notion Card */}
        <div className="bg-white rounded-2xl border-2 border-[#E5E7EB] shadow-md hover:shadow-lg transition-shadow overflow-hidden">
          <div className="bg-gradient-to-r from-[#F6F8FC] to-white px-6 py-4 border-b-2 border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1B64F2]/10 flex items-center justify-center">
                <Link className="w-5 h-5 text-[#1B64F2]" />
              </div>
              <h3 className="text-lg font-semibold text-[#0B1F3B]">Notion</h3>
            </div>
          </div>
          <div className="p-6 bg-white">
            <ConnectNotion 
              onConnected={() => setNotionConnected(true)}
              onboardingMode={true}
            />
            {notionConnected && (
              <div className="mt-4 p-3 bg-gradient-to-r from-[#10B981]/10 to-[#3EF0C1]/10 border-2 border-[#10B981]/30 rounded-lg flex items-center gap-2 text-[#10B981] text-sm font-semibold">
                <CheckCircle className="w-4 h-4" />
                Notion connected successfully
              </div>
            )}
          </div>
        </div>

        {/* WordPress Card */}
        <div className="bg-white rounded-2xl border-2 border-[#E5E7EB] shadow-md hover:shadow-lg transition-shadow overflow-hidden">
          <div className="bg-gradient-to-r from-[#F6F8FC] to-white px-6 py-4 border-b-2 border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1B64F2]/10 flex items-center justify-center">
                <Link className="w-5 h-5 text-[#1B64F2]" />
              </div>
              <h3 className="text-lg font-semibold text-[#0B1F3B]">WordPress</h3>
            </div>
          </div>
          <div className="p-6 bg-white">
            <ConnectWordPress 
              projectId={projectId}
              onboardingMode={true}
              onConnected={() => {
                setWordpressConnected(true);
                toast.success("WordPress connected!");
              }}
            />
            {wordpressConnected && (
              <div className="mt-4 p-3 bg-gradient-to-r from-[#10B981]/10 to-[#3EF0C1]/10 border-2 border-[#10B981]/30 rounded-lg flex items-center gap-2 text-[#10B981] text-sm font-semibold">
                <CheckCircle className="w-4 h-4" />
                WordPress connected successfully
              </div>
            )}
          </div>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-gradient-to-br from-[#F6F8FC] to-white rounded-2xl border-2 border-dashed border-[#E5E7EB] col-span-1 md:col-span-2 overflow-hidden">
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm border-2 border-[#E5E7EB]">
              <Sparkles className="w-8 h-8 text-[#1B64F2]" />
            </div>
            <h3 className="text-[#0B1F3B] font-semibold text-lg mb-2">More Integrations Coming</h3>
            <p className="text-sm text-[#5B6B8A] max-w-md">
              Ghost, Webflow, Shopify, and more platforms coming soon
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <Button 
          variant="outline"
          onClick={handleSkip}
          disabled={skipping}
          className="flex-1 font-semibold py-6 text-base border-2 border-[#E5E7EB] hover:border-[#1B64F2] hover:bg-[#1B64F2]/5 text-white rounded-xl transition-all"
        >
          {skipping ? "Completing..." : "Skip for Now"}
        </Button>
        <Button 
          onClick={onNext}
          size="lg"
          className="flex-1 bg-gradient-to-r from-[#1B64F2] to-[#1246C9] hover:from-[#1246C9] hover:to-[#0F3BA0] text-white font-semibold py-6 text-base shadow-lg hover:shadow-xl rounded-xl transition-all"
        >
          Complete Setup
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
