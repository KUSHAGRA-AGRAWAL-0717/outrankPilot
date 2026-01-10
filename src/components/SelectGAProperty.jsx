import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SelectGAProperty({ projectId }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // Track which property is being saved

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke("ga-properties");
        
        if (error) throw error;

        console.log("GA Properties response:", data);

        const props = data?.accountSummaries?.flatMap(a =>
          a.propertySummaries || []
        );
        setProperties(props || []);
      } catch (error) {
        console.error("Error fetching GA properties:", error);
        toast.error("Failed to load Google Analytics properties. Make sure the Analytics Admin API is enabled.");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const saveProperty = async (propertyString) => {
    // Extract the numeric ID from "properties/123456789"
    const propertyId = propertyString.replace("properties/", "");
    
    setSaving(propertyId);
    try {
      console.log("Saving property ID:", propertyId);

      const { error } = await supabase
        .from("projects")
        .update({
          ga_property_id: propertyId,
          ga_connected: true,
        })
        .eq("id", projectId);

      if (error) throw error;

      toast.success("Google Analytics property connected!");
      
     
    } catch (error) {
      console.error("Error saving property:", error);
      toast.error("Failed to save property");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B64F2]" />
        <span className="ml-2 text-sm text-[#5B6B8A]">Loading properties...</span>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          No Google Analytics properties found. Please make sure:
        </p>
        <ul className="list-disc list-inside text-sm text-yellow-800 mt-2 space-y-1">
          <li>You have access to at least one GA4 property</li>
          <li>The Google Analytics Admin API is enabled in your Google Cloud project</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#5B6B8A] mb-3">
        Found {properties.length} {properties.length === 1 ? 'property' : 'properties'}. Select one to connect:
      </p>
      {properties.map(p => (
        <button
          key={p.property}
          onClick={() => saveProperty(p.property)}
          disabled={saving !== null}
          className="w-full border border-[#8A94B3]/30 p-4 rounded-lg hover:bg-blue-50 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
        >
          <div>
            <div className="font-medium text-black">{p.displayName}</div>
            <div className="text-xs text-[#5B6B8A] mt-1">{p.property}</div>
          </div>
          {saving === p.property.replace("properties/", "") && (
            <Loader2 className="h-4 w-4 animate-spin text-[#1B64F2]" />
          )}
        </button>
      ))}
    </div>
  );
}