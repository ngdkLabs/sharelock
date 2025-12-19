import { motion } from "framer-motion";
import { Settings, Bell, Shield, LogOut, ChevronRight, MapPin } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <UserAvatar name="John Doe" size="xl" showRing isOnline />
          <div>
            <h1 className="text-2xl font-bold text-foreground">John Doe</h1>
            <p className="text-muted-foreground">@johndoe</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Location sharing active</span>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-3">
          {[{ label: "Friends", value: "12" }, { label: "Days Active", value: "45" }, { label: "Check-ins", value: "128" }].map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold gradient-text">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Settings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Settings</h2>
          <div className="glass rounded-2xl divide-y divide-border">
            {[
              { icon: MapPin, label: "Share Location", toggle: true },
              { icon: Bell, label: "Notifications", toggle: true },
              { icon: Shield, label: "Privacy" },
              { icon: Settings, label: "Preferences" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{item.label}</span>
                </div>
                {item.toggle ? <Switch defaultChecked /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </motion.div>

        <Button variant="outline" className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10">
          <LogOut className="w-5 h-5" />
          Sign Out
        </Button>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
