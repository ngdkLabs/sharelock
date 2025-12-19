import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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
  selectedUserId?: string;
}

const createCustomIcon = (user: MapUser, isSelected: boolean = false) => {
  const isCurrentUser = user.isCurrentUser;
  
  // Calculate time ago for badge
  let timeAgo = "";
  if (user.updatedAt && !isCurrentUser) {
    const date = new Date(user.updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 0) {
      timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffMins > 0) {
      timeAgo = `${diffMins}m`;
    } else {
      timeAgo = "now";
    }
  }
  
  const avatarContent = user.avatarUrl 
    ? `<img src="${user.avatarUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
    : `<span style="color: white; font-weight: 700; font-size: 20px;">${user.name.charAt(0).toUpperCase()}</span>`;
  
  const size = isSelected ? 56 : 48;
  const borderWidth = isSelected ? 4 : 3;
  
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; position: relative;">
        ${timeAgo && !isCurrentUser ? `
          <div style="
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            border-radius: 12px;
            padding: 2px 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 4px;
            z-index: 10;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            <span style="font-size: 11px; font-weight: 600; color: #333; white-space: nowrap;">${timeAgo}</span>
          </div>
        ` : ''}
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          overflow: hidden;
          border: ${borderWidth}px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          background: linear-gradient(135deg, ${isCurrentUser ? '#22c55e, #16a34a' : '#3b82f6, #2563eb'});
          display: flex;
          align-items: center;
          justify-content: center;
          ${isSelected ? 'transform: scale(1.1);' : ''}
        ">
          ${avatarContent}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 12px solid white;
          margin-top: -2px;
        "></div>
      </div>
    `,
    iconSize: [size, size + 40],
    iconAnchor: [size / 2, size + 10],
    popupAnchor: [0, -(size + 10)],
  });
};

export const MapView = ({
  users,
  center = [-6.2088, 106.8456],
  zoom = 14,
  className,
  onUserClick,
  trail,
  trailColor = "#22c55e",
  selectedUserId,
}: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const trailMarkersRef = useRef<L.CircleMarker[]>([]);
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

    // Use Google-like map style
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Subtle attribution
    L.control.attribution({
      position: "bottomleft",
      prefix: false,
    }).addAttribution('© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>').addTo(map);

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
        duration: 0.8,
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
      const isSelected = selectedUserId === user.id;
      const marker = L.marker([user.lat, user.lng], {
        icon: createCustomIcon(user, isSelected),
        zIndexOffset: isSelected ? 1000 : user.isCurrentUser ? 500 : 0,
      }).addTo(mapInstanceRef.current!);

      marker.on("click", () => {
        if (onUserClick) {
          onUserClick(user.id);
        }
      });

      markersRef.current.push(marker);
    });
  }, [users, isMapReady, onUserClick, selectedUserId]);

  // Update trail/polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    // Clear existing polyline and markers
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    trailMarkersRef.current.forEach(m => m.remove());
    trailMarkersRef.current = [];

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

      // Add circle markers for key points
      trail.forEach((point, index) => {
        const isFirst = index === 0;
        const isLast = index === trail.length - 1;
        
        if (isFirst || isLast) {
          const marker = L.circleMarker([point.lat, point.lng], {
            radius: 8,
            fillColor: isFirst ? "#22c55e" : "#ef4444",
            color: "white",
            weight: 3,
            opacity: 1,
            fillOpacity: 1,
          }).addTo(mapInstanceRef.current!);
          trailMarkersRef.current.push(marker);
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
        .leaflet-control-attribution {
          background: rgba(255,255,255,0.8) !important;
          padding: 2px 8px !important;
          font-size: 10px !important;
          border-radius: 4px !important;
          margin: 8px !important;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      <div ref={mapRef} className="w-full h-full" />
    </motion.div>
  );
};
