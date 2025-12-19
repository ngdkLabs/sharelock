import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "@/hooks/useFriends";
import { toast } from "sonner";

export const useSOS = () => {
  const { user } = useAuth();
  const { friends } = useFriends();
  const [isSending, setIsSending] = useState(false);

  const sendSOS = useCallback(async () => {
    if (!user || isSending) return false;
    
    setIsSending(true);
    
    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Get address for the location
      let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        if (data.display_name) {
          address = data.display_name;
        }
      } catch (e) {
        console.log("Could not get address for SOS");
      }

      // Send SOS message to all friends
      const acceptedFriends = friends.filter(f => f.status === 'accepted');
      
      if (acceptedFriends.length === 0) {
        toast.error("Tidak ada teman", {
          description: "Anda belum memiliki teman untuk mengirim SOS",
        });
        setIsSending(false);
        return false;
      }

      const mapsUrl = `https://maps.google.com/maps?q=${latitude},${longitude}`;
      const sosMessage = `🚨 SOS DARURAT! 🚨\n\nSaya butuh bantuan!\n\n📍 Lokasi: ${address}\n\n🗺️ Google Maps: ${mapsUrl}`;

      // Send message to each friend
      const messagePromises = acceptedFriends.map(friend => 
        supabase.from("messages").insert({
          sender_id: user.id,
          receiver_id: friend.friend_id,
          content: sosMessage,
          location_lat: latitude,
          location_lng: longitude,
          location_address: address,
        })
      );

      await Promise.all(messagePromises);

      toast.success("🚨 SOS Terkirim!", {
        description: `Lokasi darurat telah dikirim ke ${acceptedFriends.length} teman`,
        duration: 5000,
      });

      setIsSending(false);
      return true;
    } catch (error) {
      console.error("Error sending SOS:", error);
      
      if (error instanceof GeolocationPositionError) {
        toast.error("Gagal mendapatkan lokasi", {
          description: "Pastikan GPS aktif dan izin lokasi diberikan",
        });
      } else {
        toast.error("Gagal mengirim SOS", {
          description: "Terjadi kesalahan, coba lagi",
        });
      }
      
      setIsSending(false);
      return false;
    }
  }, [user, friends, isSending]);

  return {
    sendSOS,
    isSending,
  };
};
