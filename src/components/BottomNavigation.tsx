import { motion } from "framer-motion";
import { Home, Search, Users, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";

const navItems = [
  { icon: Home, path: "/map" },
  { icon: Search, path: "/friends" },
  { icon: Users, path: "/chat" },
  { icon: User, path: "/profile" },
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
      <div className="flex justify-center mx-4 mb-4 pointer-events-auto">
        <div className="bg-[#2a3441] rounded-full px-3 py-2 flex items-center gap-2 shadow-xl">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const isProfile = item.path === "/profile";

            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative flex items-center justify-center w-11 h-11 rounded-xl transition-all",
                  isActive 
                    ? "bg-white/90 text-[#2a3441]" 
                    : "text-gray-400 hover:text-white"
                )}
              >
                {isProfile && profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className={cn(
                      "w-8 h-8 rounded-full object-cover",
                      isActive && "ring-2 ring-white"
                    )}
                  />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};
