import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';

export function useFeatureAccess() {
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState({
    projects: 0,
    keywords: 0,
    articles: 0,
  });
  const [subscription, setSubscription] = useState(null);
  const [isTrialing, setIsTrialing] = useState(false);

  useEffect(() => {
    checkAccess();
    
    // Set up real-time subscription listener
    const channel = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions' },
        () => {
          console.log('Subscription changed, refreshing access');
          checkAccess();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAccess(null);
        setLoading(false);
        return;
      }

      // Get subscription
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      console.log("Subscription data:", subscription, subError);

      // Store subscription for reference
      setSubscription(subscription);

      // Check if in trial period (7 days from account creation)
      const trialEndDate = subscription?.trial_ends_at 
        ? new Date(subscription.trial_ends_at) 
        : null;
      const isInTrial = trialEndDate && new Date() < trialEndDate;
      setIsTrialing(isInTrial);

      // Determine access based on subscription status and plan
      if (subError || !subscription) {
        // No subscription - Free tier (7-day trial)
        setAccess({
          plan: "free",
          planDisplay: "Free Trial",
          canPublish: true, // Allow during trial
          canAutoPublish: false,
          canUseAIImages: false,
          canUseAutopilot: false,
          canAnalyzeCompetitors: true,
          canTrackKeywords: true,
          canExportData: false,
          canIntegrateWordPress: true,
          canIntegrateNotion: false,
          canUseCalendar: true,
          maxProjects: 1,
          maxKeywords: 5,
          maxArticles: 3,
          maxWpSites: 1,
          maxLanguages: 1,
          maxCompetitors: 2,
        });
      } else if (subscription.status === "trialing" || isInTrial) {
        // Active trial - Free tier with trial benefits
        setAccess({
          plan: "free",
          planDisplay: "Free Trial",
          canPublish: true,
          canAutoPublish: false,
          canUseAIImages: false,
          canUseAutopilot: false,
          canAnalyzeCompetitors: true,
          canTrackKeywords: true,
          canExportData: false,
          canIntegrateWordPress: true,
          canIntegrateNotion: false,
          canUseCalendar: true,
          maxProjects: 1,
          maxKeywords: 5,
          maxArticles: 3,
          maxWpSites: 1,
          maxLanguages: 1,
          maxCompetitors: 2,
        });
      } else if (!["active", "trialing"].includes(subscription.status)) {
        // Expired/inactive subscription - Restricted free tier
        setAccess({
          plan: "free",
          planDisplay: "Free (Expired)",
          canPublish: false,
          canAutoPublish: false,
          canUseAIImages: false,
          canUseAutopilot: false,
          canAnalyzeCompetitors: true,
          canTrackKeywords: true,
          canExportData: false,
          canIntegrateWordPress: false,
          canIntegrateNotion: false,
          canUseCalendar: true,
          maxProjects: 1,
          maxKeywords: 5,
          maxArticles: 0, // No new articles after expiry
          maxWpSites: 1,
          maxLanguages: 1,
          maxCompetitors: 2,
        });
      } else {
        // Active paid subscription - Map plan features
        const planFeatures = getPlanFeatures(subscription.plan);
        setAccess({
          plan: subscription.plan,
          planDisplay: getPlanDisplayName(subscription.plan),
          canPublish: true,
          canAutoPublish: subscription.auto_publish || false,
          canUseAIImages: subscription.ai_images || false,
          canUseAutopilot: planFeatures.canUseAutopilot,
          canAnalyzeCompetitors: true,
          canTrackKeywords: true,
          canExportData: planFeatures.canExportData,
          canIntegrateWordPress: true,
          canIntegrateNotion: planFeatures.canIntegrateNotion,
          canUseCalendar: true,
          maxProjects: subscription.projects_limit || planFeatures.maxProjects,
          maxKeywords: subscription.keywords_limit || planFeatures.maxKeywords,
          maxArticles: subscription.articles_limit || planFeatures.maxArticles,
          maxWpSites: planFeatures.maxWpSites,
          maxLanguages: subscription.languages_limit || planFeatures.maxLanguages,
          maxCompetitors: planFeatures.maxCompetitors,
        });
      }

      // Get current usage
      await fetchUsage(user.id);

    } catch (error) {
      console.error("Error checking access:", error);
      // Default to free plan on error
      setAccess({
        plan: "free",
        planDisplay: "Free",
        canPublish: false,
        canAutoPublish: false,
        canUseAIImages: false,
        canUseAutopilot: false,
        canAnalyzeCompetitors: true,
        canTrackKeywords: true,
        canExportData: false,
        canIntegrateWordPress: true,
        canIntegrateNotion: false,
        canUseCalendar: true,
        maxProjects: 1,
        maxKeywords: 5,
        maxArticles: 3,
        maxWpSites: 1,
        maxLanguages: 1,
        maxCompetitors: 2,
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanFeatures = (plan) => {
    const planLower = plan?.toLowerCase();
    
    switch (planLower) {
      case "premium":
      case "pro":
        return {
          canUseAutopilot: true,
          canExportData: true,
          canIntegrateNotion: true,
          maxProjects: 10,
          maxKeywords: -1, // Unlimited
          maxArticles: -1, // Unlimited
          maxWpSites: 5,
          maxLanguages: -1, // Unlimited
          maxCompetitors: -1, // Unlimited
        };
      case "grow":
      case "growth":
        return {
          canUseAutopilot: true,
          canExportData: true,
          canIntegrateNotion: true,
          maxProjects: 5,
          maxKeywords: 100,
          maxArticles: 100,
          maxWpSites: 3,
          maxLanguages: 5,
          maxCompetitors: 10,
        };
      case "essential":
      case "starter":
        return {
          canUseAutopilot: false,
          canExportData: true,
          canIntegrateNotion: false,
          maxProjects: 3,
          maxKeywords: 50,
          maxArticles: 50,
          maxWpSites: 1,
          maxLanguages: 3,
          maxCompetitors: 5,
        };
      default:
        return {
          canUseAutopilot: false,
          canExportData: false,
          canIntegrateNotion: false,
          maxProjects: 1,
          maxKeywords: 5,
          maxArticles: 3,
          maxWpSites: 1,
          maxLanguages: 1,
          maxCompetitors: 2,
        };
    }
  };

  const getPlanDisplayName = (plan) => {
    const planLower = plan?.toLowerCase();
    switch (planLower) {
      case "premium":
      case "pro":
        return "Premium";
      case "grow":
      case "growth":
        return "Grow";
      case "essential":
      case "starter":
        return "Essential";
      default:
        return "Free";
    }
  };

  const fetchUsage = async (userId) => {
    try {
      // Count projects
      const { count: projectCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Count keywords
      const { count: keywordCount } = await supabase
        .from("keywords")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Count articles (this month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: articleCount } = await supabase
        .from("content_briefs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", startOfMonth.toISOString());

      setUsage({
        projects: projectCount || 0,
        keywords: keywordCount || 0,
        articles: articleCount || 0,
      });
    } catch (error) {
      console.error("Error fetching usage:", error);
    }
  };

  const hasReachedLimit = (type) => {
    if (!access) return false;

    // -1 means unlimited
    const maxKey = `max${type.charAt(0).toUpperCase() + type.slice(1)}`;
    if (access[maxKey] === -1) {
      return false;
    }

    switch (type) {
      case 'projects':
        return usage.projects >= access.maxProjects;
      case 'keywords':
        return usage.keywords >= access.maxKeywords;
      case 'articles':
        return usage.articles >= access.maxArticles;
      default:
        return false;
    }
  };

  const canCreate = (type) => {
    return !hasReachedLimit(type);
  };

  const getLimitInfo = (type) => {
    if (!access) return { current: 0, max: 0, percentage: 0 };

    const maxKey = `max${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const max = access[maxKey];
    const current = usage[type] || 0;

    if (max === -1) {
      return {
        current,
        max: Infinity,
        percentage: 0,
        isUnlimited: true,
      };
    }

    return {
      current,
      max,
      percentage: max > 0 ? (current / max) * 100 : 0,
      isUnlimited: false,
    };
  };

  // New: Check if user has access to specific feature
  const hasAccess = (featureName) => {
    if (!access) return false;
    
    const featureKey = `can${featureName.charAt(0).toUpperCase() + featureName.slice(1)}`;
    return access[featureKey] === true;
  };

  // New: Check feature limit
  const checkLimit = (featureName) => {
    if (!access) return 0;
    
    const limitKey = `max${featureName.charAt(0).toUpperCase() + featureName.slice(1)}`;
    return access[limitKey];
  };

  // New: Get trial days remaining
  const getTrialDaysRemaining = () => {
    if (!subscription?.trial_ends_at) return 0;
    
    const trialEnd = new Date(subscription.trial_ends_at);
    const now = new Date();
    const diffTime = trialEnd - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  // New: Check if trial has expired
  const hasTrialExpired = () => {
    if (!subscription?.trial_ends_at) return false;
    return new Date() > new Date(subscription.trial_ends_at);
  };

  // New: Get remaining usage for a specific type
  const getRemainingUsage = (type) => {
    const limitInfo = getLimitInfo(type);
    if (limitInfo.isUnlimited) return Infinity;
    return Math.max(0, limitInfo.max - limitInfo.current);
  };

  // New: Check if upgrade is recommended
  const shouldUpgrade = () => {
    if (!access || access.plan !== "free") return false;
    
    // Recommend upgrade if user has reached any limit
    return (
      hasReachedLimit("projects") ||
      hasReachedLimit("keywords") ||
      hasReachedLimit("articles") ||
      hasTrialExpired()
    );
  };

  return {
    access,
    loading,
    usage,
    subscription,
    isTrialing,
    hasReachedLimit,
    canCreate,
    getLimitInfo,
    hasAccess,
    checkLimit,
    getTrialDaysRemaining,
    hasTrialExpired,
    getRemainingUsage,
    shouldUpgrade,
    refetch: checkAccess,
  };
}