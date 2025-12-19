import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { FriendCard } from "@/components/FriendCard";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Input } from "@/components/ui/input";

const mockFriends = [
  { id: "1", name: "Sarah Johnson", location: "Central Park, NYC", distance: "0.5 km", isOnline: true },
  { id: "2", name: "Mike Chen", location: "Downtown Mall", distance: "2.3 km", isOnline: true },
  { id: "3", name: "Emma Wilson", location: "Home", distance: "5.1 km", lastSeen: "2h ago", isOnline: false },
  { id: "4", name: "David Kim", location: "Office", distance: "8.7 km", lastSeen: "1d ago", isOnline: false },
];

const FriendsPage = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Friends</h1>
          <p className="text-muted-foreground">{mockFriends.length} connections</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search friends..." className="pl-12 h-12 rounded-xl bg-muted border-0" />
          </div>
        </motion.div>

        <div className="space-y-3">
          {mockFriends.map((friend, i) => (
            <motion.div key={friend.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <FriendCard {...friend} onLocate={() => console.log("Locate", friend.name)} />
            </motion.div>
          ))}
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default FriendsPage;
