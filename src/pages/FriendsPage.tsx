import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Trash2, Loader2 } from "lucide-react";
import { FriendCard } from "@/components/FriendCard";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFriends } from "@/hooks/useFriends";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
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

const FriendsPage = () => {
  const navigate = useNavigate();
  const { friends, loading, removeFriend } = useFriends();
  const { friendsLocations } = useLocationTracking();
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredFriends = friends.filter((f) =>
    f.profile.username.toLowerCase().includes(search.toLowerCase()) ||
    f.profile.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Map locations to friends
  const friendsWithLocations = filteredFriends.map((friend) => {
    const friendUserId = friend.user_id === friend.friend_id ? friend.user_id : friend.friend_id;
    const location = friendsLocations.find((loc) => loc.user_id === friendUserId);
    return {
      ...friend,
      location,
      isOnline: location && new Date(location.updated_at).getTime() > Date.now() - 5 * 60 * 1000,
    };
  });

  const handleLocate = (userId: string) => {
    navigate(`/map?focus=${userId}`);
  };

  const handleRemoveFriend = async (friendId: string) => {
    await removeFriend(friendId);
    toast.success("Friend removed");
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Friends</h1>
          <p className="text-muted-foreground">
            {friends.length} connection{friends.length !== 1 ? "s" : ""}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search friends..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 rounded-xl bg-muted border-0"
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : friendsWithLocations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {search ? "No friends found" : "No friends yet"}
            </p>
            {!search && (
              <Button
                variant="gradient"
                className="mt-4"
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <FriendCard
                  name={friend.profile.full_name || friend.profile.username}
                  imageUrl={friend.profile.avatar_url || undefined}
                  location={friend.location ? "Sharing location" : "Location hidden"}
                  distance={friend.isOnline ? "Online" : undefined}
                  lastSeen={friend.location ? formatDistanceToNow(new Date(friend.location.updated_at), { addSuffix: true }) : undefined}
                  isOnline={friend.isOnline}
                  onLocate={() => handleLocate(friend.profile.user_id)}
                  onRemove={() => setDeleteConfirm(friend.profile.user_id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this friend? You will no longer be able to see each other's locations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleRemoveFriend(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
};

export default FriendsPage;
