import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FREE_EDIT_LIMIT = 3;

export function useEditLimits() {
  const { user } = useAuth();
  const [editCount, setEditCount] = useState(0);
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const [tier, setTier] = useState<string>("free");

  const remainingEdits = tier === "free" ? Math.max(0, FREE_EDIT_LIMIT - editCount) : Infinity;
  const canEdit = tier !== "free" || editCount < FREE_EDIT_LIMIT;

  const loadWebsiteEditCount = useCallback(async (id: string) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("generated_websites")
      .select("edit_count, tier")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error loading edit count:", error);
      return;
    }

    if (data) {
      setEditCount(data.edit_count || 0);
      setTier(data.tier || "free");
      setWebsiteId(id);
    }
  }, [user]);

  const incrementEditCount = useCallback(async (): Promise<boolean> => {
    if (!user || !websiteId) return false;
    
    if (!canEdit) {
      return false;
    }

    try {
      const { data, error } = await supabase.rpc("increment_edit_count", {
        website_id: websiteId,
      });

      if (error) {
        console.error("Error incrementing edit count:", error);
        return false;
      }

      setEditCount(data as number);
      return true;
    } catch (err) {
      console.error("Error incrementing edit count:", err);
      return false;
    }
  }, [user, websiteId, canEdit]);

  const resetEditTracking = useCallback(() => {
    setEditCount(0);
    setWebsiteId(null);
    setTier("free");
  }, []);

  return {
    editCount,
    remainingEdits,
    canEdit,
    tier,
    loadWebsiteEditCount,
    incrementEditCount,
    resetEditTracking,
    FREE_EDIT_LIMIT,
  };
}
