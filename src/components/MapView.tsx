import { useEffect, useRef, useState } from "react";
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
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="position: relative;">
          <div style="position: absolute; inset: -8px; border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.3; background-color: ${color};"></div>
          <div style="position: relative; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; box-shadow: 0 4px 14px -3px ${color}80; background: linear-gradient(135deg, ${isCurrentUser ? '#14b8a6, #3b82f6' : '#f87171, #a855f7'});">
            ${initial}
          </div>
        </div>
        <div style="width: 0; height: 0; margin-top: -4px; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 10px solid ${color};"></div>
      </div>
    `,
    iconSize: [40, 60],
    iconAnchor: [20, 60],
    popupAnchor: [0, -60],
  });
};

export const MapView = ({
  users,
  center = [-6.2088, 106.8456],
  zoom = 13,
  className,
}: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapInstanceRef.current = map;
    setIsMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, mapInstanceRef.current.getZoom());
    }
  }, [center]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    users.forEach((user) => {
      const marker = L.marker([user.lat, user.lng], {
        icon: createCustomIcon(user.name, user.isCurrentUser || false),
      })
        .addTo(mapInstanceRef.current!)
        .bindPopup(`<div style="text-align: center; padding: 4px;"><strong>${user.isCurrentUser ? "You" : user.name}</strong></div>`);

      markersRef.current.push(marker);
    });
  }, [users, isMapReady]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("w-full h-full rounded-2xl overflow-hidden", className)}
    >
      <div ref={mapRef} className="w-full h-full" />
    </motion.div>
  );
};
