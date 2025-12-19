import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LocationHistoryPoint {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  recorded_at: string;
  address: string | null;
}

export const useLocationHistory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save location to history (called periodically)
  const saveToHistory = useCallback(async (
    userId: string,
    latitude: number,
    longitude: number,
    accuracy?: number
  ) => {
    try {
      const { error } = await supabase
        .from("location_history")
        .insert({
          user_id: userId,
          latitude,
          longitude,
          accuracy: accuracy || null,
        });

      if (error) throw error;
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error saving location history:", err);
      }
    }
  }, []);

  // Get location history for a user (last 24 hours by default)
  const getLocationHistory = useCallback(async (
    userId: string,
    hoursAgo: number = 24
  ): Promise<LocationHistoryPoint[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const since = new Date();
      since.setHours(since.getHours() - hoursAgo);

      const { data, error } = await supabase
        .from("location_history")
        .select("*")
        .eq("user_id", userId)
        .gte("recorded_at", since.toISOString())
        .order("recorded_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError("Gagal mengambil riwayat lokasi");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear old history (older than specified days)
  const clearOldHistory = useCallback(async (userId: string, daysOld: number = 7) => {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysOld);

      const { error } = await supabase
        .from("location_history")
        .delete()
        .eq("user_id", userId)
        .lt("recorded_at", cutoff.toISOString());

      if (error) throw error;
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error clearing old history:", err);
      }
    }
  }, []);

  return {
    saveToHistory,
    getLocationHistory,
    clearOldHistory,
    isLoading,
    error,
  };
};
