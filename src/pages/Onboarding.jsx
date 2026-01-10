import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import OnboardingLayout from "../components/layout/OnboardingLayout";
import StepProject from "./onboarding/StepProject";
import StepAudienceCompetitors from "./onboarding/StepAudienceCompetitors";
import StepBlogsArticles from "./onboarding/StepBlogsArticles";
import StepIntegrations from "./onboarding/StepIntegrations";

import { Loader2 } from "lucide-react";

const STEPS = [
  { id: 0, title: "Create Project" },
  { id: 1, title: "Audience & Competitors" },
  { id: 2, title: "Blogs & Articles" },
  { id: 3, title: "Integrations" }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [projectId, setProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_step, onboarding_completed, onboarding_project_id")
        .eq("id", user.id)
        .single();

      setUserProfile(profile);

      if (profile?.onboarding_completed) {
        navigate("/dashboard");
        return;
      }

      setStep(profile?.onboarding_step || 0);
      setProjectId(profile?.onboarding_project_id || null);
    } catch (error) {
      console.error("Onboarding load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async (extraData = {}) => {
    const newStep = step + 1;
    
    await supabase
      .from("profiles")
      .update({ 
        onboarding_step: newStep,
        ...(projectId && { onboarding_project_id: projectId }),
        ...extraData 
      })
      .eq("id", userProfile.id);

    setStep(newStep);
  };

  const prevStep = async () => {
    const newStep = step - 1;
    await supabase
      .from("profiles")
      .update({ onboarding_step: newStep })
      .eq("id", userProfile.id);
    setStep(newStep);
  };

  const completeOnboarding = async () => {
    await supabase
      .from("profiles")
      .update({ 
        onboarding_step: 4,
        onboarding_completed: true,
        ...(projectId && { onboarding_project_id: projectId })
      })
      .eq("id", userProfile.id);
    navigate("/dashboard");
  };

  const renderStep = () => {
    switch (step) {
      case 0: 
        return <StepProject onNext={nextStep} setProjectId={setProjectId} />;
      case 1: 
        return (
          <StepAudienceCompetitors 
            projectId={projectId} 
            onNext={nextStep} 
            onPrev={prevStep} 
          />
        );
      case 2: 
        return (
          <StepBlogsArticles 
            projectId={projectId} 
            onNext={nextStep} 
            onPrev={prevStep} 
          />
        );
      case 3: 
        return (
          <StepIntegrations 
            projectId={projectId} 
            onNext={completeOnboarding} 
            onPrev={prevStep} 
          />
        );
      default: 
        return null;
    }
  };

  return (
    <OnboardingLayout step={step} onPrev={step > 0 ? prevStep : undefined} loading={loading}>
      {renderStep()}
    </OnboardingLayout>
  );
}
