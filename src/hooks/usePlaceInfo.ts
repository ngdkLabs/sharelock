import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlaceInfo {
  name: string | null;
  formatted_address: string | null;
  place_id: string | null;
  photos: Array<{ photo_reference: string }>;
}

interface PlaceInfoResult {
  place: PlaceInfo | null;
  streetViewUrl: string;
  coordinates: { lat: number; lng: number };
}

export const usePlaceInfo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPlaceInfo = useCallback(async (
    lat: number,
    lng: number,
    query?: string
  ): Promise<PlaceInfoResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('place-info', {
        body: { lat, lng, query },
      });

      if (fnError) {
        console.error('Place info error:', fnError);
        setError('Gagal mengambil info tempat');
        return null;
      }

      return data as PlaceInfoResult;
    } catch (err) {
      console.error('Place info error:', err);
      setError('Gagal mengambil info tempat');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate a Street View static image URL (fallback)
  const getStreetViewUrl = useCallback((lat: number, lng: number, size: string = "400x200") => {
    // Using OpenStreetMap static image as alternative
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=17&size=${size}&maptype=osmarenderer&markers=${lat},${lng},ol-marker`;
  }, []);

  return {
    getPlaceInfo,
    getStreetViewUrl,
    isLoading,
    error,
  };
};
