// SubscriptionsTab.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
export default function SubscriptionsTab() {
  const [subs, setSubs] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("subscriptions")
.select(`
  *,
  profiles(email, full_name)
`)

      .then(({ data }) => setSubs(data || []));
  }, []);

  const overridePlan = async (subId: string, plan: string) => {
    await supabase
      .from("subscriptions")
      .update({ plan, status: "active" })
      .eq("id", subId);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {subs.map((sub) => (
        <div key={sub.id} className="p-6 border rounded-xl">
          <h3 className="font-semibold">{sub.profiles?.email}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Plan: {sub.plan} | Status: {sub.status}
          </p>
          
          <div className="space-y-2 text-xs">
            <div>Keywords: {sub.keywords_limit}</div>
            <div>Projects: {sub.projects_limit}</div>
            <div>Articles: {sub.articles_limit}</div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button 
              size="sm" 
              onClick={() => overridePlan(sub.id, "pro")}
              variant="outline"
            >
              Set Pro
            </Button>
            <Button 
              size="sm" 
              onClick={() => overridePlan(sub.id, "enterprise")}
              variant="outline"
            >
              Set Enterprise
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
