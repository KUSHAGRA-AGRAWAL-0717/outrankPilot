import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AdminGuard({ children }: { children: JSX.Element }) {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          navigate("/404");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error || data?.role !== "admin") {
          navigate("/404");
          return;
        }

        setIsChecking(false);
      } catch (error) {
        console.error("Admin guard error:", error);
        navigate("/404");
      }
    };

    checkAdminAccess();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F6F8FC]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1246C9] mx-auto mb-4"></div>
          <p className="text-[#5B6B8A]">Verifying access...</p>
        </div>
      </div>
    );
  }

  return children;
}
