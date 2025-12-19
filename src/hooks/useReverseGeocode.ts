import { useState, useCallback } from "react";

interface GeocodingResult {
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    village?: string;
    county?: string;
  };
}

export const useReverseGeocode = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAddress = useCallback(async (lat: number, lng: number): Promise<GeocodingResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "id",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch address");
      }

      const data = await response.json();
      return data as GeocodingResult;
    } catch (err) {
      setError("Gagal mengambil alamat");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getAddress, isLoading, error };
};
