import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UserLocation {
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  battery_level?: number | null;
  updated_at: string;
}

interface FriendLocation extends UserLocation {
  profile?: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const useLocationTracking = () => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [friendsLocations, setFriendsLocations] = useState<FriendLocation[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Update location in database
  const updateLocationInDb = useCallback(async (position: GeolocationPosition) => {
    if (!user) return;

    const locationData = {
      user_id: user.id,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("user_locations")
      .upsert(locationData, { onConflict: "user_id" });

    if (error) {
      console.error("Error updating location:", error);
    }
  }, [user]);

  // Start tracking location
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported");
      return;
    }

    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation(position);
        setError(null);
        updateLocationInDb(position);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  }, [updateLocationInDb]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Fetch friends' locations
  const fetchFriendsLocations = useCallback(async () => {
    if (!user) return;

    // Get accepted friends
    const { data: friends, error: friendsError } = await supabase
      .from("friend_connections")
      .select("user_id, friend_id")
      .eq("status", "accepted")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (friendsError) {
      console.error("Error fetching friends:", friendsError);
      return;
    }

    const friendIds = friends?.map((f) =>
      f.user_id === user.id ? f.friend_id : f.user_id
    ) || [];

    if (friendIds.length === 0) {
      setFriendsLocations([]);
      return;
    }

    // Get locations
    const { data: locations, error: locError } = await supabase
      .from("user_locations")
      .select("*")
      .in("user_id", friendIds);

    if (locError) {
      console.error("Error fetching locations:", locError);
      return;
    }

    // Get profiles separately
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, full_name, avatar_url")
      .in("user_id", friendIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

    const locationsWithProfiles: FriendLocation[] = (locations || []).map((loc) => ({
      ...loc,
      profile: profileMap.get(loc.user_id),
    }));

    setFriendsLocations(locationsWithProfiles);
  }, [user]);

  // Subscribe to real-time location updates
  useEffect(() => {
    if (!user) return;

    fetchFriendsLocations();

    channelRef.current = supabase
      .channel("user_locations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_locations",
        },
        () => {
          fetchFriendsLocations();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, fetchFriendsLocations]);

  // Auto-start tracking when user is logged in
  useEffect(() => {
    if (user && !isTracking) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [user]);

  return {
    currentLocation,
    friendsLocations,
    isTracking,
    error,
    startTracking,
    stopTracking,
    refetch: fetchFriendsLocations,
  };
};
