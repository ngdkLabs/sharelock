import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crosshair, Plus, Minus } from "lucide-react";
import { MapView } from "@/components/MapView";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";

const mockUsers = [
  { id: "1", name: "You", lat: -6.2088, lng: 106.8456, isCurrentUser: true },
  { id: "2", name: "Sarah", lat: -6.2120, lng: 106.8500, isCurrentUser: false },
  { id: "3", name: "Mike", lat: -6.2050, lng: 106.8400, isCurrentUser: false },
];

const MapPage = () => {
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([-6.2088, 106.8456]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => console.log("Location access denied")
      );
    }
  }, []);

  return (
    <div className="h-screen w-full relative bg-background">
      <MapView users={mockUsers} center={currentLocation} className="h-full w-full" />

      {/* Floating controls */}
      <div className="absolute top-6 right-4 z-20 flex flex-col gap-2">
        <Button variant="glass" size="icon" className="shadow-card">
          <Plus className="w-5 h-5" />
        </Button>
        <Button variant="glass" size="icon" className="shadow-card">
          <Minus className="w-5 h-5" />
        </Button>
      </div>

      {/* Center button */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute bottom-28 right-4 z-20"
      >
        <Button variant="gradient" size="icon" className="w-14 h-14 rounded-2xl shadow-glow-teal">
          <Crosshair className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* Status card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-4 right-20 z-20"
      >
        <div className="glass rounded-2xl p-4 shadow-card">
          <p className="text-sm font-medium text-foreground">2 friends nearby</p>
          <p className="text-xs text-muted-foreground">Sharing your location</p>
        </div>
      </motion.div>

      <BottomNavigation />
    </div>
  );
};

export default MapPage;
