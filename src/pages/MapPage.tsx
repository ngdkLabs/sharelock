import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, Plus, Minus, Users, Navigation2, Battery, MapPin, X, Clock, Loader2 } from "lucide-react";
import { MapView } from "@/components/MapView";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useReverseGeocode } from "@/hooks/useReverseGeocode";
import { formatDistanceToNow } from "date-fns";

interface SelectedUser {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isCurrentUser?: boolean;
  avatarUrl?: string | null;
  updatedAt?: string;
  address?: string;
}

const MapPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { currentLocation, friendsLocations, isTracking, error } = useLocationTracking();
  const { getAddress, isLoading: isLoadingAddress } = useReverseGeocode();
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2088, 106.8456]);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);

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

  const handleUserClick = async (userId: string) => {
    const targetUser = mapUsers.find((u) => u.id === userId);
    if (targetUser) {
      setMapCenter([targetUser.lat, targetUser.lng]);
      setSelectedUser({ ...targetUser, address: undefined });
      
      // Fetch address
      const result = await getAddress(targetUser.lat, targetUser.lng);
      if (result) {
        const addr = result.address;
        const parts = [
          addr.road && (addr.house_number ? `${addr.road} No. ${addr.house_number}` : addr.road),
          addr.suburb || addr.village,
          addr.city || addr.county,
          addr.state,
          addr.postcode,
        ].filter(Boolean);
        
        setSelectedUser(prev => prev ? { ...prev, address: parts.join(", ") || result.display_name } : null);
      }
    }
  };

  const closeUserDetail = () => {
    setSelectedUser(null);
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
      {friendsLocations.length > 0 && !selectedUser && (
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

      {/* User Detail Card */}
      <AnimatePresence>
        {selectedUser && (
          <>
            {/* Backdrop to close on tap outside */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-35"
              onClick={closeUserDetail}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="absolute bottom-24 left-4 right-4 z-40"
            >
              <div className="bg-card/95 backdrop-blur-xl rounded-3xl p-5 shadow-card border border-border/50">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xl overflow-hidden">
                      {selectedUser.avatarUrl ? (
                        <img src={selectedUser.avatarUrl} className="w-full h-full object-cover" alt={selectedUser.name} />
                      ) : (
                        selectedUser.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-card" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-foreground truncate">
                        {selectedUser.isCurrentUser ? "Lokasi Anda" : selectedUser.name}
                      </h3>
                      <button
                        type="button"
                        className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeUserDetail();
                        }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-2 mt-2">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      {isLoadingAddress || !selectedUser.address ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Mengambil alamat...</span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {selectedUser.address}
                        </p>
                      )}
                    </div>

                    {/* Last updated */}
                    {selectedUser.updatedAt && (
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          Update {formatDistanceToNow(new Date(selectedUser.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                    )}

                    {/* Coordinates */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground/70 font-mono">
                      <span>{selectedUser.lat.toFixed(6)}, {selectedUser.lng.toFixed(6)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNavigation />
    </div>
  );
};

export default MapPage;
