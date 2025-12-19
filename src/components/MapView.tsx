import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MapUser {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isCurrentUser?: boolean;
  avatarUrl?: string | null;
  updatedAt?: string;
}

interface TrailPoint {
  lat: number;
  lng: number;
  recorded_at: string;
}

interface MapViewProps {
  users: MapUser[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  onUserClick?: (userId: string) => void;
  trail?: TrailPoint[];
  trailColor?: string;
}

const createCustomIcon = (user: MapUser) => {
  const isCurrentUser = user.isCurrentUser;
  const color = isCurrentUser ? "#14b8a6" : "#f87171";
  const initial = user.name.charAt(0).toUpperCase();
  const avatarContent = user.avatarUrl 
    ? `<img src="${user.avatarUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
    : initial;
  
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 12px ${color}80);">
        <div style="position: relative;">
          <div style="position: absolute; inset: -6px; border-radius: 50%; animation: pulse 2s ease-in-out infinite; background: ${color}40;"></div>
          <div style="position: relative; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px; border: 3px solid white; overflow: hidden; background: linear-gradient(135deg, ${isCurrentUser ? '#14b8a6, #0ea5e9' : '#f87171, #a855f7'});">
            ${user.avatarUrl ? avatarContent : initial}
          </div>
          <div style="position: absolute; bottom: 0; right: 0; width: 14px; height: 14px; border-radius: 50%; background: #22c55e; border: 2px solid white;"></div>
        </div>
        <div style="margin-top: 4px; padding: 4px 10px; background: rgba(0,0,0,0.8); border-radius: 12px; backdrop-filter: blur(8px);">
          <span style="color: white; font-size: 11px; font-weight: 600; white-space: nowrap;">${isCurrentUser ? 'You' : user.name}</span>
        </div>
      </div>
    `,
    iconSize: [48, 80],
    iconAnchor: [24, 80],
    popupAnchor: [0, -80],
  });
};

export const MapView = ({
  users,
  center = [-6.2088, 106.8456],
  zoom = 14,
  className,
  onUserClick,
  trail,
  trailColor = "#14b8a6",
}: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Use CartoDB Positron for cleaner look (similar to iSharing)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Add attribution in a subtle way
    L.control.attribution({
      position: "bottomleft",
      prefix: false,
    }).addAttribution('© <a href="https://carto.com/">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OSM</a>').addTo(map);

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
      mapInstanceRef.current.flyTo(center, mapInstanceRef.current.getZoom(), {
        duration: 1,
      });
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
        icon: createCustomIcon(user),
      }).addTo(mapInstanceRef.current!);

      marker.on("click", () => {
        if (onUserClick) {
          onUserClick(user.id);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if multiple users
    if (users.length > 1) {
      const bounds = L.latLngBounds(users.map((u) => [u.lat, u.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [users, isMapReady, onUserClick]);

  // Update trail/polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    // Add new polyline if trail exists
    if (trail && trail.length > 1) {
      const latlngs: L.LatLngExpression[] = trail.map((p) => [p.lat, p.lng]);
      
      polylineRef.current = L.polyline(latlngs, {
        color: trailColor,
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(mapInstanceRef.current);

      // Add circle markers for each point
      trail.forEach((point, index) => {
        const isFirst = index === 0;
        const isLast = index === trail.length - 1;
        
        if (isFirst || isLast || index % 5 === 0) {
          L.circleMarker([point.lat, point.lng], {
            radius: isFirst || isLast ? 8 : 4,
            fillColor: isFirst ? "#22c55e" : isLast ? "#ef4444" : trailColor,
            color: "white",
            weight: 2,
            opacity: 1,
            fillOpacity: 1,
          }).addTo(mapInstanceRef.current!);
        }
      });
    }
  }, [trail, trailColor, isMapReady]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("w-full h-full overflow-hidden", className)}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 0; }
        }
        .leaflet-control-attribution {
          background: rgba(255,255,255,0.7) !important;
          padding: 2px 6px !important;
          font-size: 10px !important;
          border-radius: 4px !important;
        }
      `}</style>
      <div ref={mapRef} className="w-full h-full" />
    </motion.div>
  );
};
