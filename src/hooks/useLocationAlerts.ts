import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface LocationAlert {
  id: string;
  user_id: string;
  friend_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useLocationAlerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<LocationAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all alerts for current user
  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("location_alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts((data as LocationAlert[]) || []);
    } catch (err) {
      console.error("Error fetching alerts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Create a new alert
  const createAlert = useCallback(async (
    friendId: string,
    name: string,
    latitude: number,
    longitude: number,
    radius: number = 100
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("location_alerts")
        .insert({
          user_id: user.id,
          friend_id: friendId,
          name,
          latitude,
          longitude,
          radius,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Notifikasi dibuat",
        description: `Anda akan diberitahu ketika teman sampai di ${name}`,
      });
      
      await fetchAlerts();
      return data as LocationAlert;
    } catch (err) {
      console.error("Error creating alert:", err);
      toast({
        title: "Gagal membuat notifikasi",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast, fetchAlerts]);

  // Toggle alert active status
  const toggleAlert = useCallback(async (alertId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("location_alerts")
        .update({ is_active: isActive })
        .eq("id", alertId);

      if (error) throw error;
      await fetchAlerts();
    } catch (err) {
      console.error("Error toggling alert:", err);
    }
  }, [fetchAlerts]);

  // Delete an alert
  const deleteAlert = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("location_alerts")
        .delete()
        .eq("id", alertId);

      if (error) throw error;
      
      toast({
        title: "Notifikasi dihapus",
      });
      
      await fetchAlerts();
    } catch (err) {
      console.error("Error deleting alert:", err);
    }
  }, [toast, fetchAlerts]);

  // Check if friend is within alert radius
  const checkAlerts = useCallback(async (
    friendId: string,
    friendLat: number,
    friendLng: number
  ) => {
    const activeAlerts = alerts.filter(
      a => a.friend_id === friendId && a.is_active
    );

    for (const alert of activeAlerts) {
      const distance = calculateDistance(
        alert.latitude,
        alert.longitude,
        friendLat,
        friendLng
      );

      // Distance is in km, radius is in meters
      const distanceInMeters = distance * 1000;

      if (distanceInMeters <= alert.radius) {
        // Check if we haven't triggered recently (within 10 minutes)
        const lastTriggered = alert.last_triggered_at 
          ? new Date(alert.last_triggered_at).getTime() 
          : 0;
        const now = Date.now();
        const tenMinutes = 10 * 60 * 1000;

        if (now - lastTriggered > tenMinutes) {
          // Trigger notification
          triggerNotification(alert);

          // Update last_triggered_at
          await supabase
            .from("location_alerts")
            .update({ last_triggered_at: new Date().toISOString() })
            .eq("id", alert.id);
        }
      }
    }
  }, [alerts]);

  // Request notification permission - silently fail if not supported
  const requestNotificationPermission = useCallback(async () => {
    // Check if we're in a secure context and notifications are available
    if (typeof window === 'undefined' || !("Notification" in window)) {
      // Silently return false - don't show error toast
      console.log("Notifications not supported in this environment");
      return false;
    }

    try {
      if (Notification.permission === "granted") {
        return true;
      }

      if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      }
    } catch (error) {
      console.log("Error requesting notification permission:", error);
    }

    return false;
  }, []);

  // Trigger browser notification
  const triggerNotification = (alert: LocationAlert) => {
    if (Notification.permission === "granted") {
      new Notification("Teman Sampai! 📍", {
        body: `Teman Anda telah sampai di ${alert.name}`,
        icon: "/favicon.ico",
        tag: alert.id,
      });
    }

    // Also show toast
    toast({
      title: "Teman Sampai! 📍",
      description: `Teman Anda telah sampai di ${alert.name}`,
    });
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Load alerts on mount
  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user, fetchAlerts]);

  return {
    alerts,
    isLoading,
    fetchAlerts,
    createAlert,
    toggleAlert,
    deleteAlert,
    checkAlerts,
    requestNotificationPermission,
  };
};
