import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Clock, 
  History, 
  Eye, 
  Car, 
  Loader2,
  Calendar,
  Route,
  Building,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Bell,
  Plus,
  MessageCircle,
  Share2,
  AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useLocationHistory, LocationHistoryPoint } from "@/hooks/useLocationHistory";
import { usePlaceInfo } from "@/hooks/usePlaceInfo";
import { AddLocationAlert, LocationAlertList } from "@/components/LocationAlertComponents";
import { useFriends } from "@/hooks/useFriends";
import { useSOS } from "@/hooks/useSOS";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FriendLocationDetailProps {
  friend: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    avatarUrl?: string | null;
    updatedAt?: string;
    address?: string;
    distance?: string;
  };
  onClose: () => void;
  onShowTrail: (userId: string) => void;
  showingTrail: boolean;
  isLoadingHistory: boolean;
}

interface PlaceVisit {
  id: string;
  address: string;
  lat: number;
  lng: number;
  arrivedAt: string;
  leftAt?: string;
  duration?: string;
}

export const FriendLocationDetail = ({
  friend,
  onClose,
  onShowTrail,
  showingTrail,
  isLoadingHistory,
}: FriendLocationDetailProps) => {
  const navigate = useNavigate();
  const { myInviteCode } = useFriends();
  const { sendSOS, isSending: isSendingSOS } = useSOS();
  const [activeTab, setActiveTab] = useState<"location" | "history" | "places" | "alerts">("location");
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [historyData, setHistoryData] = useState<LocationHistoryPoint[]>([]);
  const [placesVisited, setPlacesVisited] = useState<PlaceVisit[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [streetViewImage, setStreetViewImage] = useState<string | null>(null);
  const [placeInfo, setPlaceInfo] = useState<{ name: string | null } | null>(null);
  const [imageError, setImageError] = useState(false);
  const { getLocationHistory } = useLocationHistory();
  const { getPlaceInfo, getStreetViewUrl, isLoading: isLoadingPlace } = usePlaceInfo();

  const handleOpenChat = () => {
    navigate('/chat');
  };

  const handleShareInvite = async () => {
    const shareData = {
      title: 'LocateMe - Share Location',
      text: `Join me on LocateMe! Use my invite code: ${myInviteCode}`,
      url: window.location.origin,
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(`Join me on LocateMe! Use my invite code: ${myInviteCode}`);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleSOS = async () => {
    await sendSOS();
  };

  // Load place info and street view image
  useEffect(() => {
    const loadPlaceInfo = async () => {
      setImageError(false);
      // Generate static map URL
      const mapUrl = getStreetViewUrl(friend.lat, friend.lng);
      setStreetViewImage(mapUrl);
      
      // Fetch place info from API
      const info = await getPlaceInfo(friend.lat, friend.lng);
      if (info?.place) {
        setPlaceInfo({ name: info.place.name });
      }
    };
    
    loadPlaceInfo();
  }, [friend.lat, friend.lng]);

  // Load full history when history tab is selected
  useEffect(() => {
    if (activeTab === "history" || activeTab === "places") {
      loadHistory();
    }
  }, [activeTab, friend.id]);

  const loadHistory = async () => {
    setIsLoadingPlaces(true);
    const history = await getLocationHistory(friend.id, 168); // Last 7 days
    setHistoryData(history);
    
    // Process history to find places visited (cluster nearby points)
    const places = await processPlacesFromHistory(history);
    setPlacesVisited(places);
    setIsLoadingPlaces(false);
  };

  const processPlacesFromHistory = async (history: LocationHistoryPoint[]): Promise<PlaceVisit[]> => {
    if (history.length === 0) return [];

    const places: PlaceVisit[] = [];
    let currentCluster: LocationHistoryPoint[] = [];
    const CLUSTER_DISTANCE = 0.1; // 100 meters

    const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    for (let i = 0; i < history.length; i++) {
      const point = history[i];
      
      if (currentCluster.length === 0) {
        currentCluster.push(point);
      } else {
        const lastPoint = currentCluster[currentCluster.length - 1];
        const distance = getDistance(lastPoint.latitude, lastPoint.longitude, point.latitude, point.longitude);
        
        if (distance < CLUSTER_DISTANCE) {
          currentCluster.push(point);
        } else {
          // Save current cluster as a place
          if (currentCluster.length >= 2) {
            const avgLat = currentCluster.reduce((sum, p) => sum + p.latitude, 0) / currentCluster.length;
            const avgLng = currentCluster.reduce((sum, p) => sum + p.longitude, 0) / currentCluster.length;
            
            const arrivedAt = currentCluster[0].recorded_at;
            const leftAt = currentCluster[currentCluster.length - 1].recorded_at;
            const durationMs = new Date(leftAt).getTime() - new Date(arrivedAt).getTime();
            const durationMins = Math.round(durationMs / 60000);
            
            places.push({
              id: currentCluster[0].id,
              address: currentCluster[0].address || `${avgLat.toFixed(4)}, ${avgLng.toFixed(4)}`,
              lat: avgLat,
              lng: avgLng,
              arrivedAt,
              leftAt,
              duration: durationMins > 60 ? `${Math.round(durationMins / 60)}h ${durationMins % 60}m` : `${durationMins}m`,
            });
          }
          currentCluster = [point];
        }
      }
    }

    // Process last cluster
    if (currentCluster.length >= 2) {
      const avgLat = currentCluster.reduce((sum, p) => sum + p.latitude, 0) / currentCluster.length;
      const avgLng = currentCluster.reduce((sum, p) => sum + p.longitude, 0) / currentCluster.length;
      
      places.push({
        id: currentCluster[0].id,
        address: currentCluster[0].address || `${avgLat.toFixed(4)}, ${avgLng.toFixed(4)}`,
        lat: avgLat,
        lng: avgLng,
        arrivedAt: currentCluster[0].recorded_at,
        leftAt: currentCluster[currentCluster.length - 1].recorded_at,
        duration: "Now",
      });
    }

    return places.reverse(); // Most recent first
  };

  const openStreetView = () => {
    const url = `https://maps.google.com/maps?q=&layer=c&cbll=${friend.lat},${friend.lng}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openInMaps = (lat: number, lng: number) => {
    const url = `https://maps.google.com/maps?daddr=${lat},${lng}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openPlace = (lat: number, lng: number) => {
    const url = `https://maps.google.com/maps?q=${lat},${lng}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Hari ini";
    if (isYesterday(date)) return "Kemarin";
    return format(date, "EEEE, d MMM", { locale: localeId });
  };

  const groupHistoryByDate = (history: LocationHistoryPoint[]) => {
    const groups: { [key: string]: LocationHistoryPoint[] } = {};
    
    history.forEach(point => {
      const dateKey = format(new Date(point.recorded_at), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(point);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute bottom-0 left-0 right-0 z-40 max-h-[85vh] flex flex-col"
    >
      <div className="bg-card rounded-t-3xl shadow-elevated flex flex-col max-h-full">
        {/* Handle bar */}
        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-2 flex-shrink-0" />
        
        {/* Header */}
        <div className="px-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            {friend.avatarUrl ? (
              <img 
                src={friend.avatarUrl} 
                alt={friend.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                {friend.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">{friend.name}</h2>
              {friend.address && (
                <p className="text-sm text-muted-foreground line-clamp-1">{friend.address}</p>
              )}
            </div>
          </div>

          {/* Distance and Time */}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            {friend.distance && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{friend.distance}</span>
              </div>
            )}
            {friend.updatedAt && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDistanceToNow(new Date(friend.updatedAt), { addSuffix: true })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-5 flex-shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab("location")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "location" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground"
            }`}
          >
            Lokasi
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "history" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground"
            }`}
          >
            Riwayat
          </button>
          <button
            onClick={() => setActiveTab("places")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "places" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground"
            }`}
          >
            Tempat
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center justify-center gap-1 ${
              activeTab === "alerts" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground"
            }`}
          >
            <Bell className="w-4 h-4" />
            Notif
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-24">
          <AnimatePresence mode="wait">
            {activeTab === "location" && (
              <motion.div
                key="location"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-5"
              >
                {/* Action Buttons - Row 1 */}
                <div className="grid grid-cols-4 gap-3">
                  <button
                    onClick={handleOpenChat}
                    className="flex flex-col items-center gap-2 py-4 border border-border rounded-xl hover:bg-muted transition-colors"
                  >
                    <MessageCircle className="w-6 h-6 text-primary" />
                    <span className="text-xs text-foreground">Pesan</span>
                  </button>
                  
                  <button
                    onClick={handleShareInvite}
                    className="flex flex-col items-center gap-2 py-4 border border-border rounded-xl hover:bg-muted transition-colors"
                  >
                    <Share2 className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-foreground">Share</span>
                  </button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        disabled={isSendingSOS}
                        className="flex flex-col items-center gap-2 py-4 border border-destructive/50 rounded-xl hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      >
                        {isSendingSOS ? (
                          <Loader2 className="w-6 h-6 text-destructive animate-spin" />
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-destructive" />
                        )}
                        <span className="text-xs text-destructive font-medium">
                          {isSendingSOS ? "Mengirim..." : "SOS"}
                        </span>
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="w-5 h-5" />
                          Kirim SOS Darurat?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Lokasi Anda saat ini akan dikirim ke <strong>semua teman</strong> sebagai pesan darurat. 
                          Gunakan fitur ini hanya dalam situasi darurat.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-border">Batal</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleSOS}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          🚨 Kirim SOS
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <button
                    onClick={() => openInMaps(friend.lat, friend.lng)}
                    className="flex flex-col items-center gap-2 py-4 border border-border rounded-xl hover:bg-muted transition-colors"
                  >
                    <Car className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-foreground">Arahkan</span>
                  </button>
                </div>

                {/* Location Details */}
                <div className="mt-5 bg-muted/50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Detail Lokasi</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Koordinat</span>
                      <span className="text-foreground font-mono text-xs">
                        {friend.lat.toFixed(6)}, {friend.lng.toFixed(6)}
                      </span>
                    </div>
                    {friend.updatedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Terakhir update</span>
                        <span className="text-foreground">
                          {format(new Date(friend.updatedAt), "HH:mm, d MMM yyyy")}
                        </span>
                      </div>
                    )}
                    {friend.address && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Alamat</span>
                        <span className="text-foreground text-right max-w-[60%]">
                          {friend.address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-5"
              >
                {isLoadingPlaces ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : historyData.length === 0 ? (
                  <div className="text-center py-10">
                    <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Belum ada riwayat lokasi</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groupHistoryByDate(historyData).map(([dateKey, points]) => (
                      <div key={dateKey}>
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-primary" />
                          <h4 className="text-sm font-medium text-foreground">
                            {formatDate(points[0].recorded_at)}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            ({points.length} titik)
                          </span>
                        </div>
                        
                        <div className="space-y-2 ml-2 border-l-2 border-primary/20 pl-4">
                          {points.slice(0, 10).map((point, idx) => (
                            <button
                              key={point.id}
                              onClick={() => openPlace(point.latitude, point.longitude)}
                              className="w-full flex items-start gap-3 py-2 hover:bg-muted/50 rounded-lg transition-colors px-2 -ml-2"
                            >
                              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                              <div className="flex-1 text-left">
                                <p className="text-sm text-foreground">
                                  {point.address || `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(point.recorded_at), "HH:mm")}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />
                            </button>
                          ))}
                          {points.length > 10 && (
                            <p className="text-xs text-muted-foreground pl-2">
                              +{points.length - 10} titik lainnya
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "places" && (
              <motion.div
                key="places"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-5"
              >
                {isLoadingPlaces ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : placesVisited.length === 0 ? (
                  <div className="text-center py-10">
                    <Building className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Belum ada tempat yang dikunjungi</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground mb-4">
                      Tempat yang dikunjungi 7 hari terakhir
                    </p>
                    
                    {placesVisited.map((place, idx) => (
                      <button
                        key={place.id}
                        onClick={() => openPlace(place.lat, place.lng)}
                        className="w-full bg-muted/50 rounded-xl p-4 flex items-start gap-3 hover:bg-muted transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-foreground line-clamp-2">
                            {place.address}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(place.arrivedAt), "HH:mm, d MMM")}
                            </span>
                            {place.duration && (
                              <>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-primary font-medium">
                                  {place.duration}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground mt-2" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "alerts" && (
              <motion.div
                key="alerts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-foreground">
                    Notifikasi Lokasi
                  </h4>
                  <button
                    onClick={() => setShowAddAlert(true)}
                    className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mb-4">
                  Dapatkan notifikasi ketika {friend.name} sampai di lokasi tertentu
                </p>

                <LocationAlertList 
                  friendId={friend.id} 
                  friendName={friend.name}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Alert Modal */}
      <AnimatePresence>
        {showAddAlert && (
          <AddLocationAlert
            friendId={friend.id}
            friendName={friend.name}
            currentLat={friend.lat}
            currentLng={friend.lng}
            currentAddress={friend.address}
            onClose={() => setShowAddAlert(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
