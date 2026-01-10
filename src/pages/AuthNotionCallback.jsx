import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function NotionCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Connecting to Notion...");
  const [error, setError] = useState(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError("Notion authorization was denied");
      setTimeout(() => navigate("/integrations"), 3000);
      return;
    }

    if (code) {
      handleCallback(code);
    } else {
      setError("No authorization code received");
      setTimeout(() => navigate("/integrations"), 3000);
    }
  }, [searchParams, navigate]);

  const handleCallback = async (code) => {
    try {
      setStatus("Exchanging authorization code...");
      
      const projectId = window.localStorage.getItem("notion_pending_project");
      const userId = window.localStorage.getItem("notion_pending_user");

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      // Get the session token to pass to edge function
      const token = session.access_token;

      // Call edge function to exchange code with authorization header
      const { data, error } = await supabase.functions.invoke('notion-exchange', {
        body: { 
          code, 
          projectId,
          userId 
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (error) throw error;

      if (data?.success) {
        setStatus("Successfully connected to Notion!");
        window.localStorage.removeItem("notion_pending_project");
        window.localStorage.removeItem("notion_pending_user");
        
        setTimeout(() => {
          navigate("/integrations");
        }, 1500);
      } else {
        throw new Error(data?.error || "Failed to connect");
      }
    } catch (error) {
      console.error("Notion connection failed:", error);
      setError(error.message || "Failed to connect to Notion");
      setTimeout(() => navigate("/integrations"), 3000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
        {error ? (
          <>
            <div className="text-red-600 text-xl mb-4 font-semibold">❌ {error}</div>
            <p className="text-gray-700">Redirecting back to integrations...</p>
          </>
        ) : (
          <>
            <div className="text-purple-600 text-xl mb-4 font-semibold">📝 {status}</div>
            <div className="animate-pulse text-gray-700 mt-2">Please wait...</div>
          </>
        )}
      </div>
    </div>
  );
}