import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function ConnectGoogleAnalytics({ projectId }) {
  const [connecting, setConnecting] = useState(false);

  const connect = async () => {
    if (!projectId) {
      alert("Please select a project first");
      return;
    }

    setConnecting(true);

    // Store projectId for callback
    localStorage.setItem("ga_pending_project", projectId);

    const redirectUri = `${window.location.origin}/auth/callback`;
    
    console.log("Redirect URI:", redirectUri);
    
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      access_type: "offline",
      prompt: "consent",
      state: projectId,
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  return (
    <button 
      onClick={connect} 
      disabled={connecting || !projectId}
      className="bg-[#1B64F2] hover:bg-[#1557D8] text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {connecting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>🔗 Connect Google Analytics</>
      )}
    </button>
  );
}