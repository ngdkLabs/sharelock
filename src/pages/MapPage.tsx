import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crosshair, Plus, Minus, Users, Navigation2, Battery } from "lucide-react";
import { MapView } from "@/components/MapView";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { formatDistanceToNow } from "date-fns";

const MapPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { currentLocation, friendsLocations, isTracking, error } = useLocationTracking();
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2088, 106.8456]);

  useEffect(() => {
    if (currentLocation) {
      setMapCenter([currentLocation.coords.latitude, currentLocation.coords.longitude]);
    }
  }, [currentLocation]);

  // Build map users array
  const mapUsers = [
    // Current user
    ...(currentLocation && user ? [{
      id: user.id,
      name: profile?.full_name || profile?.username || "You",
      lat: currentLocation.coords.latitude,
      lng: currentLocation.coords.longitude,
      isCurrentUser: true,
      avatarUrl: profile?.avatar_url,
    }] : []),
    // Friends
    ...friendsLocations.map((loc) => ({
      id: loc.user_id,
      name: loc.profile?.full_name || loc.profile?.username || "Friend",
      lat: loc.latitude,
      lng: loc.longitude,
      isCurrentUser: false,
      avatarUrl: loc.profile?.avatar_url,
      updatedAt: loc.updated_at,
    })),
  ];

  const handleCenterOnMe = () => {
    if (currentLocation) {
      setMapCenter([currentLocation.coords.latitude, currentLocation.coords.longitude]);
    }
  };

  const handleUserClick = (userId: string) => {
    const targetUser = mapUsers.find((u) => u.id === userId);
    if (targetUser) {
      setMapCenter([targetUser.lat, targetUser.lng]);
    }
  };

  return (
    <div className="h-screen w-full relative bg-background overflow-hidden">
      {/* Map layer - lowest z-index */}
      <div className="absolute inset-0 z-0">
        <MapView 
          users={mapUsers} 
          center={mapCenter} 
          className="h-full w-full" 
          onUserClick={handleUserClick}
        />
      </div>

      {/* Floating controls - Right side */}
      <div className="absolute top-24 right-4 z-30 flex flex-col gap-2">
        <Button variant="glass" size="icon" className="shadow-card w-12 h-12 rounded-xl bg-card/90">
          <Plus className="w-5 h-5" />
        </Button>
        <Button variant="glass" size="icon" className="shadow-card w-12 h-12 rounded-xl bg-card/90">
          <Minus className="w-5 h-5" />
        </Button>
      </div>

      {/* Center on me button */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute bottom-32 right-4 z-30"
      >
        <Button 
          variant="gradient" 
          size="icon" 
          className="w-14 h-14 rounded-2xl shadow-glow-teal"
          onClick={handleCenterOnMe}
        >
          <Crosshair className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* Status card - Top */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-4 right-20 z-30"
      >
        <div className="glass rounded-2xl p-4 shadow-card bg-card/90">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  {friendsLocations.length} friend{friendsLocations.length !== 1 ? "s" : ""} nearby
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {isTracking ? (
                  <>
                    <Navigation2 className="w-3 h-3 text-teal animate-pulse" />
                    <span className="text-xs text-teal">Sharing location</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Location off</span>
                )}
              </div>
            </div>
            {currentLocation && (
              <div className="text-right text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Battery className="w-3 h-3" />
                  <span>Accuracy: {Math.round(currentLocation.coords.accuracy || 0)}m</span>
                </div>
              </div>
            )}
          </div>
          {error && (
            <p className="text-xs text-destructive mt-2">{error}</p>
          )}
        </div>
      </motion.div>

      {/* Friends preview - Bottom */}
      {friendsLocations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-32 left-4 right-20 z-30"
        >
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {friendsLocations.slice(0, 4).map((loc) => (
              <button
                key={loc.user_id}
                onClick={() => handleUserClick(loc.user_id)}
                className="flex-shrink-0 glass rounded-2xl p-3 flex items-center gap-3 hover:bg-card/90 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-warm flex items-center justify-center text-secondary-foreground font-bold">
                  {loc.profile?.avatar_url ? (
                    <img src={loc.profile.avatar_url} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (loc.profile?.username || "?").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground truncate max-w-[80px]">
                    {loc.profile?.full_name || loc.profile?.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(loc.updated_at), { addSuffix: true })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <BottomNavigation />
    </div>
  );
};

export default MapPage;
