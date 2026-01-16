import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import OnboardingLayout from "../components/layout/OnboardingLayout";
import StepProject from "./FilesBoard/StepProject";
import StepAudienceCompetitors from "./FilesBoard/StepAudienceCompetitors";
import StepBlogsArticles from "./FilesBoard/StepBlogsArticles";
import StepIntegrations from "./FilesBoard/StepIntegrations";

const STEPS = [
  { id: 0, title: "Create Project" },
  { id: 1, title: "Audience & Competitors" },
  { id: 2, title: "Blogs & Articles" },
  { id: 3, title: "Integrations" }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error("Authentication required");
        navigate("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("onboarding_step, onboarding_completed, onboarding_project_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        toast.error("Failed to load onboarding progress");
        return;
      }

      // If onboarding is complete, redirect to dashboard
      if (profile?.onboarding_completed) {
        navigate("/dashboard");
        return;
      }

      // Set current step and projectId from profile
      setStep(profile?.onboarding_step || 0);
      setProjectId(profile?.onboarding_project_id || null);
      
    } catch (error) {
      console.error("Onboarding load error:", error);
      toast.error("An error occurred while loading onboarding");
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (newStep: number, newProjectId?: string) => {
    if (!userId) return;

    try {
      const updateData: any = { onboarding_step: newStep };
      
      if (newProjectId) {
        updateData.onboarding_project_id = newProjectId;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId);

      if (error) {
        console.error("Progress update error:", error);
        toast.error("Failed to save progress");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Update progress error:", error);
      return false;
    }
  };

  const nextStep = async (createdProjectId?: string) => {
    const newStep = step + 1;
    
    // If projectId is passed (from step 1), update it
    if (createdProjectId) {
      setProjectId(createdProjectId);
      const success = await updateProgress(newStep, createdProjectId);
      if (success) {
        setStep(newStep);
      }
    } else {
      const success = await updateProgress(newStep);
      if (success) {
        setStep(newStep);
      }
    }
  };

  const prevStep = async () => {
    // Prevent going back from first step
    if (step === 0) return;
    
    const newStep = step - 1;
    const success = await updateProgress(newStep);
    if (success) {
      setStep(newStep);
    }
  };

  const completeOnboarding = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          onboarding_step: 4,
          onboarding_completed: true,
          ...(projectId && { onboarding_project_id: projectId })
        })
        .eq("id", userId);

      if (error) {
        console.error("Complete onboarding error:", error);
        toast.error("Failed to complete onboarding");
        return;
      }

      toast.success("🎉 Onboarding completed successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Complete onboarding error:", error);
      toast.error("An error occurred");
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: 
        return (
          <StepProject 
            onNext={nextStep} 
            existingProjectId={projectId}
          />
        );
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
    <OnboardingLayout 
      step={step} 
      onPrev={step > 0 ? prevStep : undefined} 
      loading={loading}
    >
      {renderStep()}
    </OnboardingLayout>
  );
}
