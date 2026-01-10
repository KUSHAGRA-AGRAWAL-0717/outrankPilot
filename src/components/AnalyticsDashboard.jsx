import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function AnalyticsDashboard({ projectId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    fetchAnalytics();
  }, [projectId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: invokeError } = await supabase.functions.invoke("ga-report", {
        body: { projectId, days: 30 },
      });

      console.log("Project ID:", projectId);
      console.log("Analytics Data:", data);

      if (invokeError) throw invokeError;

      setAnalytics(data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!projectId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">No project selected</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B64F2]" />
        <span className="ml-2 text-[#5B6B8A]">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">Error loading analytics: {error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow border border-[#8A94B3]/30">
        <h3 className="text-sm font-medium text-[#5B6B8A] mb-2">Total Sessions</h3>
        <div className="text-3xl font-bold text-black">{analytics?.sessions?.toLocaleString() || 0}</div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow border border-[#8A94B3]/30">
        <h3 className="text-sm font-medium text-[#5B6B8A] mb-2">Users</h3>
        <div className="text-3xl font-bold text-black">{analytics?.users?.toLocaleString() || 0}</div>
      </div>
    </div>
  );
}