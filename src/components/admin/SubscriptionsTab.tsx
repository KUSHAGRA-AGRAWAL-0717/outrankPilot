import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, CreditCard, Users, CheckCircle, XCircle, AlertCircle, Crown, Zap, ImageIcon } from "lucide-react";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  keywords_limit: number;
  projects_limit: number;
  articles_limit: number;
  auto_publish: boolean;
  ai_images: boolean;
  trial_start_at: string | null;
  trial_ends_at: string | null;
  subscription_start_at: string | null;
  subscription_end_at: string | null;
  cancel_at_period_end: boolean;
  paystack_customer_id: string | null;
  paystack_reference: string | null;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

export default function SubscriptionsTab() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        profiles(email, full_name)
      `)
      .order("subscription_start_at", { ascending: false, nullsFirst: false });

    if (!error && data) {
      setSubs(
        data.map((item: any) => ({
          id: item.id,
          plan: item.plan,
          status: item.status,
          keywords_limit: item.keywords_limit,
          projects_limit: item.projects_limit,
          articles_limit: item.articles_limit,
          auto_publish: item.auto_publish,
          ai_images: item.ai_images,
          trial_start_at: item.trial_start_at ?? null,
          trial_ends_at: item.trial_ends_at ?? null,
          subscription_start_at: item.subscription_start_at ?? null,
          subscription_end_at: item.subscription_end_at ?? null,
          cancel_at_period_end: item.cancel_at_period_end ?? false,
          paystack_customer_id: item.paystack_customer_id ?? null,
          paystack_reference: item.paystack_reference ?? null,
          profiles: item.profiles ?? { email: "", full_name: null },
        }))
      );
    }
    setLoading(false);
  };

  const overridePlan = async (subId: string, plan: string) => {
    const limits = {
      free: { 
        keywords: 5, 
        projects: 1, 
        articles: 3, 
        wpSites: 1,
        autoPublish: false,
        aiImages: false,
        languagesLimit: 1
      },
      essential: { 
        keywords: 500, 
        projects: 3, 
        articles: 30,
        wpSites: 1,
        autoPublish: false,
        aiImages: true,
        languagesLimit: 150
      },
      grow: { 
        keywords: 2000, 
        projects: 10, 
        articles: 60,
        wpSites: 3,
        autoPublish: true,
        aiImages: true,
        languagesLimit: 150
      },
      premium: { 
        keywords: 999999, 
        projects: 9999, 
        articles: -1,
        wpSites: -1,
        autoPublish: true,
        aiImages: true,
        languagesLimit: 150
      },
    };

    const limit = limits[plan as keyof typeof limits];

    const { error } = await supabase
      .from("subscriptions")
      .update({ 
        plan, 
        status: "active",
        keywords_limit: limit.keywords,
        projects_limit: limit.projects,
        articles_limit: limit.articles,
        auto_publish: limit.autoPublish,
        ai_images: limit.aiImages,
        languages_limit: limit.languagesLimit,
      })
      .eq("id", subId);

    if (!error) {
      fetchSubscriptions();
    }
  };

  const cancelSubscription = async (subId: string) => {
    const { error } = await supabase
      .from("subscriptions")
      .update({ 
        status: "canceled",
        cancel_at_period_end: true,
      })
      .eq("id", subId);

    if (!error) {
      fetchSubscriptions();
    }
  };

  const getPlanColor = (plan: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-900 border-gray-300',
      essential: 'bg-blue-100 text-blue-900 border-blue-300',
      grow: 'bg-purple-100 text-purple-900 border-purple-300',
      premium: 'bg-yellow-100 text-yellow-900 border-yellow-300'
    };
    return colors[plan as keyof typeof colors] || 'bg-gray-100 text-gray-900 border-gray-300';
  };

  const getPlanIcon = (plan: string) => {
    if (plan === 'premium') return <Crown className="h-4 w-4" />;
    if (plan === 'grow') return <Zap className="h-4 w-4" />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Users</p>
                <p className="text-2xl font-bold text-white">{subs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Active</p>
                <p className="text-2xl font-bold text-white">
                  {subs.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">On Trial</p>
                <p className="text-2xl font-bold text-white">
                  {subs.filter(s => s.trial_start_at && s.trial_ends_at).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Canceled</p>
                <p className="text-2xl font-bold text-white">
                  {subs.filter(s => s.status === 'canceled' || s.cancel_at_period_end).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subs.map((sub) => (
          <Card key={sub.id} className="border-2 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate text-white">
                    {sub.profiles?.email}
                  </CardTitle>
                  {sub.profiles?.full_name && (
                    <p className="text-sm text-gray mt-1">{sub.profiles.full_name}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Plan and Status Badges */}
              <div className="flex gap-2 flex-wrap">
                <Badge className={`${getPlanColor(sub.plan)} border-2 font-bold capitalize`}>
                  {getPlanIcon(sub.plan)}
                  <span className="ml-1">{sub.plan}</span>
                </Badge>
                <Badge 
                  className={sub.status === "active" 
                    ? "bg-green-100 text-green-900 border-2 border-green-300 font-bold" 
                    : "bg-red-100 text-red-900 border-2 border-red-300 font-bold"
                  }
                >
                  {sub.status}
                </Badge>
                {sub.cancel_at_period_end && (
                  <Badge className="bg-orange-100 text-orange-900 border-2 border-orange-300 font-semibold text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Canceling
                  </Badge>
                )}
              </div>

              {/* Trial Info */}
              {sub.trial_start_at && sub.trial_ends_at && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-blue-700" />
                    <p className="font-bold text-blue-900 text-sm">Trial Period</p>
                  </div>
                  <p className="text-blue-800 text-sm font-medium">
                    Ends: {format(new Date(sub.trial_ends_at), "MMM dd, yyyy")}
                  </p>
                </div>
              )}

              {/* Subscription Info */}
              {sub.subscription_start_at && (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-700" />
                    <p className="font-bold text-green-900 text-sm">Active Since</p>
                  </div>
                  <p className="text-green-800 text-sm font-medium">
                    {format(new Date(sub.subscription_start_at), "MMM dd, yyyy")}
                  </p>
                  {sub.subscription_end_at && (
                    <p className="text-green-800 text-sm font-medium mt-1">
                      Renews: {format(new Date(sub.subscription_end_at), "MMM dd, yyyy")}
                    </p>
                  )}
                </div>
              )}

              {/* Payment Info */}
              {sub.paystack_reference && (
                <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="h-4 w-4 text-gray-700" />
                    <p className="font-bold text-gray-900 text-sm">Payment Ref</p>
                  </div>
                  <p className="text-gray-800 text-xs font-mono truncate font-medium">
                    {sub.paystack_reference}
                  </p>
                </div>
              )}

              {/* Limits */}
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold text-sm">Keywords:</span>
                  <span className="font-bold text-gray-900">
                    {sub.keywords_limit === -1 ? "Unlimited" : sub.keywords_limit.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold text-sm">Projects:</span>
                  <span className="font-bold text-gray-900">
                    {sub.projects_limit === -1 ? "Unlimited" : sub.projects_limit.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold text-sm">Articles:</span>
                  <span className="font-bold text-gray-900">
                    {sub.articles_limit === -1 ? "Unlimited" : sub.articles_limit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="flex gap-2 flex-wrap">
                {sub.auto_publish && (
                  <Badge className="bg-purple-100 text-purple-900 border-2 border-purple-300 font-semibold">
                    <Zap className="h-3 w-3 mr-1" />
                    Auto Publish
                  </Badge>
                )}
                {sub.ai_images && (
                  <Badge className="bg-pink-100 text-pink-900 border-2 border-pink-300 font-semibold">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    AI Images
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button 
                  size="sm" 
                  onClick={() => overridePlan(sub.id, "essential")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold border-2 border-blue-700"
                >
                  Essential
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => overridePlan(sub.id, "grow")}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold border-2 border-purple-700"
                >
                  Grow
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => overridePlan(sub.id, "premium")}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold border-2 border-yellow-700"
                >
                  Premium
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => cancelSubscription(sub.id)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold border-2 border-red-700"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}