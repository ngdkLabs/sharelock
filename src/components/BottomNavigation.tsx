import { motion } from "framer-motion";
import { Map, Users, UserPlus, User, MessageCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";

const navItems = [
  { icon: Map, label: "Map", path: "/map" },
  { icon: Users, label: "Friends", path: "/friends" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: UserPlus, label: "Add", path: "/invite" },
  { icon: User, label: "Profile", path: "/profile" },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useProfile();

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe pointer-events-none"
    >
      <div className="bg-black/30 backdrop-blur-xl saturate-150 rounded-full px-2 py-2 flex justify-between items-center shadow-2xl border border-white/10 mx-auto max-w-[350px] pointer-events-auto mb-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const isProfile = item.label === "Profile";

          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/20 backdrop-blur-sm rounded-full border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}

              {isProfile && profile?.avatar_url ? (
                <div className={cn(
                  "w-9 h-9 rounded-full overflow-hidden relative z-10 transition-all duration-300 border-[1.5px]",
                  isActive ? "border-primary scale-110 shadow-glow-green" : "border-white/60 hover:border-white"
                )}>
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <Icon
                  className={cn(
                    "w-5 h-5 relative z-10 transition-all duration-300",
                    isActive ? "text-primary scale-110" : "text-white/60 hover:text-white"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              )}

            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};
