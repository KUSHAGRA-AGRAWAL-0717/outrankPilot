import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Link, Zap, CheckCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ConnectNotion from "../../components/ConnectNotion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ConnectWordPress from "../../components/ConnectWordPress";

export default function StepIntegrations({ projectId, onNext, onPrev }) {
  const navigate = useNavigate();
  const [notionConnected, setNotionConnected] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#1B64F2] to-[#3EF0C1] rounded-2xl flex items-center justify-center shadow-lg">
          <Zap className="w-10 h-10 text-black" />
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0B1F3B] mb-4 leading-tight">
            Connect Your Tools
          </h1>
          <p className="text-lg text-[#5B6B8A] max-w-2xl mx-auto">
            Connect your publishing platforms to automate content workflow
          </p>
          <p className="text-sm text-[#8A94B3]">
            Optional - You can skip this step and set up later
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-[#E5E7EB] shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4 border-b border-[#E5E7EB]">
            <CardTitle className="flex items-center gap-3 text-[#0B1F3B] text-lg">
              <div className="w-10 h-10 rounded-lg bg-[#1B64F2]/10 flex items-center justify-center">
                <Link className="w-5 h-5 text-[#1B64F2]" />
              </div>
              Notion
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ConnectNotion 
              onConnected={() => setNotionConnected(true)}
              onboardingMode={true}
            />
            {notionConnected && (
              <div className="mt-4 p-3 bg-[#3EF0C1]/20 border border-[#10B981]/30 rounded-lg flex items-center gap-2 text-[#10B981] text-sm font-semibold">
                <CheckCircle className="w-4 h-4" />
                Notion connected
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB] shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4 border-b border-[#E5E7EB]">
            <CardTitle className="flex items-center gap-3 text-[#0B1F3B] text-lg">
              <div className="w-10 h-10 rounded-lg bg-[#1B64F2]/10 flex items-center justify-center">
                <Link className="w-5 h-5 text-[#1B64F2]" />
              </div>
              WordPress
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ConnectWordPress 
              onboardingMode={true}
              onConnected={() => console.log("WP Connected")}
            />
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed border-[#E5E7EB] bg-[#F6F8FC]/50 col-span-1 md:col-span-2">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm">
              <Sparkles className="w-8 h-8 text-[#8A94B3]" />
            </div>
            <h3 className="text-[#0B1F3B] font-semibold mb-2">More Integrations Coming</h3>
            <p className="text-sm text-[#5B6B8A]">
              Ghost, Webflow, Shopify, and more platforms coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <Button 
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="flex-1 font-semibold py-6 text-base border-2 border-[#E5E7EB] hover:border-[#1B64F2] hover:bg-[#1B64F2]/5 text-[#0B1F3B] rounded-xl"
        >
          Skip for Now
        </Button>
        <Button 
          onClick={onNext}
          size="lg"
          className="flex-1 bg-[#1B64F2] hover:bg-[#1246C9] text-black font-semibold py-6 text-base shadow-lg hover:shadow-xl rounded-xl"
        >
          Complete Setup
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}