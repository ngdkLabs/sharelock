import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapUser {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isCurrentUser?: boolean;
  imageUrl?: string;
}

interface MapViewProps {
  users: MapUser[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

const createCustomIcon = (name: string, isCurrentUser: boolean) => {
  const color = isCurrentUser ? "#14b8a6" : "#f87171";
  const initial = name.charAt(0).toUpperCase();
  
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div class="relative flex flex-col items-center">
        <div class="relative">
          <div class="absolute -inset-2 rounded-full animate-ping opacity-30" style="background-color: ${color};"></div>
          <div class="relative w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg" style="background: linear-gradient(135deg, ${isCurrentUser ? '#14b8a6, #3b82f6' : '#f87171, #a855f7'});">
            ${initial}
          </div>
        </div>
        <div class="w-0 h-0 -mt-1 border-l-[6px] border-r-[6px] border-t-[10px] border-l-transparent border-r-transparent" style="border-top-color: ${color};"></div>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50],
  });
};

const MapController = ({ center }: { center?: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
};

export const MapView = ({
  users,
  center = [-6.2088, 106.8456], // Jakarta default
  zoom = 13,
  className,
}: MapViewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("w-full h-full rounded-2xl overflow-hidden", className)}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} />
        
        {users.map((user) => (
          <Marker
            key={user.id}
            position={[user.lat, user.lng]}
            icon={createCustomIcon(user.name, user.isCurrentUser || false)}
          >
            <Popup className="custom-popup">
              <div className="text-center p-2">
                <p className="font-semibold">{user.isCurrentUser ? "You" : user.name}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </motion.div>
  );
};
