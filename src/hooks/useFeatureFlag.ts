// useFeatureFlag.ts
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFeatureFlag(key: string) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: flag } = await supabase
        .from("feature_flags")
        .select("*")
        .eq("key", key)
        .single();

      if (!flag?.enabled) return setEnabled(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return setEnabled(false);

      const hash =
        user.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 100;

      setEnabled(hash < flag.rollout_percentage);
    })();
  }, [key]);

  return enabled;
}
