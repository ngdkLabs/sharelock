import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Loader2, Users } from "lucide-react";
import { FriendCard } from "@/components/FriendCard";
import { FriendLocationDetail } from "@/components/FriendLocationDetail";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFriends } from "@/hooks/useFriends";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useReverseGeocode } from "@/hooks/useReverseGeocode";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import bgBlur from "@/assets/bg-blur.png";

interface SelectedFriend {
  id: string;
  name: string;
  lat: number;
  lng: number;
  avatarUrl?: string | null;
  updatedAt?: string;
  address?: string;
  distance?: string;
}

const FriendsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { friends, loading, removeFriend } = useFriends();
  const { friendsLocations, currentLocation } = useLocationTracking();
  const { getAddress } = useReverseGeocode();
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<SelectedFriend | null>(null);

  const filteredFriends = friends.filter((f) =>
    f.profile.username.toLowerCase().includes(search.toLowerCase()) ||
    f.profile.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Map locations to friends
  const friendsWithLocations = filteredFriends.map((friend) => {
    // Get the friend's user_id (the one that's not the current user)
    const friendUserId = friend.user_id === user?.id ? friend.friend_id : friend.user_id;
    const location = friendsLocations.find((loc) => loc.user_id === friendUserId);
    return {
      ...friend,
      location,
      friendUserId, // Store this for later use
      isOnline: location && new Date(location.updated_at).getTime() > Date.now() - 5 * 60 * 1000,
    };
  });

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleFriendClick = async (friend: typeof friendsWithLocations[0]) => {
    // If no location, still show the detail but without location info
    const hasLocation = !!friend.location;
    
    let distanceStr = "";
    let lat = 0;
    let lng = 0;
    let updatedAt = "";

    if (hasLocation && friend.location) {
      lat = friend.location.latitude;
      lng = friend.location.longitude;
      updatedAt = friend.location.updated_at;

      if (currentLocation) {
        const dist = calculateDistance(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
          lat,
          lng
        );
        distanceStr = dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
      }
    } else {
      // If no location, show a toast but still open the detail
      toast.info("Friend's location is currently not available");
      // Use default coordinates (won't be shown anyway)
      lat = 0;
      lng = 0;
    }

    setSelectedFriend({
      id: friend.friendUserId,
      name: friend.profile.full_name || friend.profile.username,
      lat,
      lng,
      avatarUrl: friend.profile.avatar_url,
      updatedAt: updatedAt || undefined,
      address: undefined,
      distance: distanceStr || undefined,
    });

    // Fetch address only if location is available
    if (hasLocation && lat !== 0 && lng !== 0) {
      const result = await getAddress(lat, lng);
      if (result) {
        const addr = result.address;
        const parts = [
          addr.road && (addr.house_number ? `${addr.road} No. ${addr.house_number}` : addr.road),
          addr.suburb || addr.village,
          addr.city || addr.county,
        ].filter(Boolean);

        setSelectedFriend(prev => prev ? {
          ...prev,
          address: parts.length > 0 ? `${parts.join(", ")}` : result.display_name
        } : null);
      }
    }
  };

  const handleLocate = (friend: typeof friendsWithLocations[0]) => {
    if (!friend.location) {
      toast.error("Friend's location is not available");
      return;
    }
    navigate(`/map?focus=${friend.friendUserId}`);
  };

  const handleRemoveFriend = async (friendId: string) => {
    await removeFriend(friendId);
    toast.success("Friend removed");
    setDeleteConfirm(null);
  };

  const closeDetail = () => {
    setSelectedFriend(null);
  };

  return (
    <div className="min-h-screen relative pb-24">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgBlur})` }}
      />
      
      {/* Header */}
      <div className="relative z-10 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 sticky top-0 z-40">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-foreground">Friends</h1>
          <p className="text-sm text-muted-foreground">
            {friends.length} connection{friends.length !== 1 ? "s" : ""}
          </p>
        </motion.div>
      </div>

      <div className="relative z-10 px-4 py-4 space-y-4">
        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search friends..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 rounded-xl bg-muted border-0 focus-visible:ring-primary"
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : friendsWithLocations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {search ? "No friends found" : "No friends yet"}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {search ? "Try a different search term" : "Invite your friends to connect"}
            </p>
            {!search && (
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-green"
                onClick={() => navigate("/invite")}
              >
                Add Friends
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            {friendsWithLocations.map((friend, i) => (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.03 }}
              >
                <FriendCard
                  name={friend.profile.full_name || friend.profile.username}
                  imageUrl={friend.profile.avatar_url || undefined}
                  location={friend.location ? "Sharing location" : "Location hidden"}
                  distance={friend.isOnline ? "Online" : undefined}
                  lastSeen={friend.location ? formatDistanceToNow(new Date(friend.location.updated_at), { addSuffix: true }) : undefined}
                  isOnline={friend.isOnline}
                  onClick={() => handleFriendClick(friend)}
                  onLocate={() => handleLocate(friend)}
                  onRemove={() => setDeleteConfirm(friend.friendUserId)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card border border-border shadow-elevated rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this friend? You will no longer be able to see each other's locations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleRemoveFriend(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Friend Detail Bottom Sheet */}
      <AnimatePresence>
        {selectedFriend && (
          <FriendLocationDetail
            friend={selectedFriend}
            onClose={closeDetail}
            onShowTrail={() => {}}
            showingTrail={false}
            isLoadingHistory={false}
          />
        )}
      </AnimatePresence>

      <BottomNavigation />
    </div>
  );
};

export default FriendsPage;
