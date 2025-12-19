import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MessageCircle, Navigation } from "lucide-react";
import { MapView } from "@/components/MapView";
import { BottomNavigation } from "@/components/BottomNavigation";
import { FriendLocationDetail } from "@/components/FriendLocationDetail";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useReverseGeocode } from "@/hooks/useReverseGeocode";
import { useLocationHistory } from "@/hooks/useLocationHistory";
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
  distance?: string;
}

interface TrailPoint {
  lat: number;
  lng: number;
  recorded_at: string;
}

const MapPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { currentLocation, friendsLocations, isTracking } = useLocationTracking();
  const { getAddress, isLoading: isLoadingAddress } = useReverseGeocode();
  const { getLocationHistory, isLoading: isLoadingHistory } = useLocationHistory();
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2088, 106.8456]);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [showingTrailFor, setShowingTrailFor] = useState<string | null>(null);

  useEffect(() => {
    if (currentLocation) {
      setMapCenter([currentLocation.coords.latitude, currentLocation.coords.longitude]);
    }
  }, [currentLocation]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const mapUsers = [
    ...(currentLocation && user ? [{
      id: user.id,
      name: profile?.full_name || profile?.username || "You",
      lat: currentLocation.coords.latitude,
      lng: currentLocation.coords.longitude,
      isCurrentUser: true,
      avatarUrl: profile?.avatar_url,
    }] : []),
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

  const handleUserClick = async (userId: string) => {
    const targetUser = mapUsers.find((u) => u.id === userId);
    if (targetUser) {
      setMapCenter([targetUser.lat, targetUser.lng]);
      
      let distanceStr = "";
      if (currentLocation && !targetUser.isCurrentUser) {
        const dist = calculateDistance(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
          targetUser.lat,
          targetUser.lng
        );
        distanceStr = dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
      }
      
      setSelectedUser({ ...targetUser, address: undefined, distance: distanceStr });
      
      const result = await getAddress(targetUser.lat, targetUser.lng);
      if (result) {
        const addr = result.address;
        const parts = [
          addr.road && (addr.house_number ? `${addr.road} No. ${addr.house_number}` : addr.road),
          addr.suburb || addr.village,
          addr.city || addr.county,
        ].filter(Boolean);
        
        setSelectedUser(prev => prev ? { 
          ...prev, 
          address: parts.length > 0 ? `${parts.join(", ")}` : result.display_name 
        } : null);
      }
    }
  };

  const closeUserDetail = () => {
    setSelectedUser(null);
    setTrail([]);
    setShowingTrailFor(null);
  };

  const handleShowHistory = async (userId: string) => {
    if (showingTrailFor === userId) {
      setTrail([]);
      setShowingTrailFor(null);
      return;
    }

    const history = await getLocationHistory(userId, 24);
    const trailPoints: TrailPoint[] = history.map((h) => ({
      lat: h.latitude,
      lng: h.longitude,
      recorded_at: h.recorded_at,
    }));
    
    setTrail(trailPoints);
    setShowingTrailFor(userId);
  };

  const openInMaps = (lat: number, lng: number) => {
    const url = `https://maps.google.com/maps?daddr=${lat},${lng}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-screen w-full relative bg-background overflow-hidden">
      {/* Map layer */}
      <div className="absolute inset-0 z-0">
        <MapView 
          users={mapUsers} 
          center={mapCenter} 
          className="h-full w-full" 
          onUserClick={handleUserClick}
          trail={trail}
          trailColor={showingTrailFor === user?.id ? "#22c55e" : "#3b82f6"}
          selectedUserId={selectedUser?.id}
        />
      </div>

      {/* Top buttons */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between">
        {selectedUser ? (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={closeUserDetail}
            className="w-12 h-12 rounded-full bg-card shadow-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
        ) : (
          <div />
        )}
        
        {selectedUser && !selectedUser.isCurrentUser && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-12 h-12 rounded-full bg-card shadow-card flex items-center justify-center"
          >
            <MessageCircle className="w-5 h-5 text-foreground" />
          </motion.button>
        )}
      </div>

      {/* Directions FAB */}
      {selectedUser && !selectedUser.isCurrentUser && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => openInMaps(selectedUser.lat, selectedUser.lng)}
          className="absolute bottom-[60%] right-4 z-30 w-14 h-14 rounded-full bg-card shadow-card flex items-center justify-center"
        >
          <Navigation className="w-6 h-6 text-primary" />
        </motion.button>
      )}

      {/* Friend Detail Bottom Sheet */}
      <AnimatePresence>
        {selectedUser && !selectedUser.isCurrentUser && (
          <FriendLocationDetail
            friend={selectedUser}
            onClose={closeUserDetail}
            onShowTrail={handleShowHistory}
            showingTrail={showingTrailFor === selectedUser.id}
            isLoadingHistory={isLoadingHistory}
          />
        )}
      </AnimatePresence>

      {/* Self location card - simpler */}
      <AnimatePresence>
        {selectedUser && selectedUser.isCurrentUser && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-40"
          >
            <div className="bg-card rounded-t-3xl shadow-elevated pt-3 pb-24 px-5">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
              <h2 className="text-lg font-bold text-foreground">Lokasi Anda</h2>
              {selectedUser.address ? (
                <p className="text-sm text-muted-foreground mt-1">{selectedUser.address}</p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">Mengambil alamat...</p>
              )}
              <p className="text-xs text-muted-foreground/70 font-mono mt-2">
                {selectedUser.lat.toFixed(6)}, {selectedUser.lng.toFixed(6)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friends preview */}
      {friendsLocations.length > 0 && !selectedUser && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-24 left-4 right-4 z-30"
        >
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {friendsLocations.slice(0, 4).map((loc) => (
              <button
                key={loc.user_id}
                onClick={() => handleUserClick(loc.user_id)}
                className="flex-shrink-0 bg-card rounded-2xl p-3 flex items-center gap-3 shadow-card border border-border/50 hover:shadow-elevated transition-shadow"
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold overflow-hidden">
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
