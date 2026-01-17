import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';

export function useFeatureAccess() {
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAccess(null);
        setLoading(false);
        return;
      }

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!subscription || subscription.status !== "active") {
        setAccess({
          plan: "free",
          canPublish: false,
          canAutoPublish: false,
          canUseAIImages: false,
          maxProjects: 1,
          maxKeywords: 5,
          maxArticles: 3,
          maxWpSites: 1,
        });
      } else {
        setAccess({
          plan: subscription.plan,
          canPublish: true,
          canAutoPublish: subscription.auto_publish,
          canUseAIImages: subscription.ai_images,
          maxProjects: subscription.projects_limit,
          maxKeywords: subscription.keywords_limit,
          maxArticles: subscription.articles_limit,
          maxWpSites: subscription.wpSites || 1,
        });
      }
    } catch (error) {
      console.error("Error checking access:", error);
    } finally {
      setLoading(false);
    }
  };

  return { access, loading, refetch: checkAccess };
}
