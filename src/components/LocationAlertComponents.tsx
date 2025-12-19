import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Plus, 
  MapPin, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  X,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocationAlerts, LocationAlert } from "@/hooks/useLocationAlerts";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface AddLocationAlertProps {
  friendId: string;
  friendName: string;
  currentLat: number;
  currentLng: number;
  currentAddress?: string;
  onClose: () => void;
}

export const AddLocationAlert = ({
  friendId,
  friendName,
  currentLat,
  currentLng,
  currentAddress,
  onClose,
}: AddLocationAlertProps) => {
  const { createAlert, requestNotificationPermission } = useLocationAlerts();
  const [name, setName] = useState(currentAddress || "Lokasi saat ini");
  const [radius, setRadius] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [customLat, setCustomLat] = useState(currentLat.toString());
  const [customLng, setCustomLng] = useState(currentLng.toString());

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Request notification permission first
    await requestNotificationPermission();
    
    const lat = useCurrentLocation ? currentLat : parseFloat(customLat);
    const lng = useCurrentLocation ? currentLng : parseFloat(customLng);
    
    const result = await createAlert(friendId, name, lat, lng, radius);
    
    setIsSubmitting(false);
    
    if (result) {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Tambah Notifikasi</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Dapatkan notifikasi ketika <span className="font-medium text-foreground">{friendName}</span> sampai di lokasi ini.
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nama Lokasi</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Rumah, Kantor, Sekolah"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="radius">Radius (meter)</Label>
            <Input
              id="radius"
              type="number"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value) || 100)}
              min={50}
              max={1000}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Notifikasi akan dikirim jika teman berada dalam radius {radius}m dari lokasi
            </p>
          </div>

          <div className="bg-muted/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Lokasi</span>
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCurrentLocation}
                onChange={(e) => setUseCurrentLocation(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-foreground">Gunakan lokasi teman saat ini</span>
            </label>

            {useCurrentLocation ? (
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input
                  placeholder="Latitude"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  type="number"
                  step="any"
                />
                <Input
                  placeholder="Longitude"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  type="number"
                  step="any"
                />
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !name.trim()}
          className="w-full"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Bell className="w-4 h-4 mr-2" />
          )}
          Buat Notifikasi
        </Button>
      </motion.div>
    </motion.div>
  );
};

interface LocationAlertListProps {
  friendId?: string;
  friendName?: string;
}

export const LocationAlertList = ({ friendId, friendName }: LocationAlertListProps) => {
  const { alerts, isLoading, toggleAlert, deleteAlert } = useLocationAlerts();

  const filteredAlerts = friendId 
    ? alerts.filter(a => a.friend_id === friendId)
    : alerts;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (filteredAlerts.length === 0) {
    return (
      <div className="text-center py-8">
        <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">
          {friendId 
            ? `Belum ada notifikasi untuk ${friendName || 'teman ini'}`
            : "Belum ada notifikasi lokasi"
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredAlerts.map((alert) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/50 rounded-xl p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-foreground">{alert.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Radius: {alert.radius}m
              </p>
              {alert.last_triggered_at && (
                <p className="text-xs text-primary mt-1">
                  Terakhir dipicu {formatDistanceToNow(new Date(alert.last_triggered_at), { 
                    addSuffix: true, 
                    locale: localeId 
                  })}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleAlert(alert.id, !alert.is_active)}
                className="p-2 hover:bg-background rounded-lg transition-colors"
              >
                {alert.is_active ? (
                  <ToggleRight className="w-6 h-6 text-primary" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                )}
              </button>
              <button
                onClick={() => deleteAlert(alert.id)}
                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
