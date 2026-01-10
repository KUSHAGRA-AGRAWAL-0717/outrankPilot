import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Connecting...");
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      console.error("OAuth error:", error);
      toast.error("Google authentication failed");
      navigate("/competitor-analysis");
      return;
    }

    if (code) {
      exchangeCode(code);
    }
  }, [code, error]);

  const exchangeCode = async (code) => {
    try {
      setStatus("Authenticating...");
      
      const projectId = localStorage.getItem("ga_pending_project");
      if (!projectId) {
        throw new Error("Project ID not found");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Exchanging code for project:", projectId);
      setStatus("Exchanging authorization code...");

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ga-exchange`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ 
            code, 
            projectId, 
            userId: user.id 
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to connect Google Analytics");
      }

      console.log("GA Connection successful");
      localStorage.removeItem("ga_pending_project");
      
      setStatus("Success! Redirecting...");
      toast.success("Google Analytics connected successfully!");
      
      setTimeout(() => {
        navigate("/competitor-analysis");
      }, 1000);
    } catch (error) {
      console.error("GA Connection failed:", error);
      toast.error(error.message || "Failed to connect Google Analytics");
      
      setTimeout(() => {
        navigate("/competitor-analysis");
      }, 2000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F6F8FC]">
      <div className="text-center bg-white p-8 rounded-xl shadow-lg">
        <Loader2 className="h-12 w-12 animate-spin text-[#1B64F2] mx-auto mb-4" />
        <p className="text-lg text-black font-medium">{status}</p>
      </div>
    </div>
  );
}

export default AuthCallback;