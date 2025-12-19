import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng, query } = await req.json();
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');

    if (!rapidApiKey) {
      console.error('RAPIDAPI_KEY is not configured');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build search query from coordinates or text query
    const searchQuery = query || `${lat},${lng}`;
    console.log('Searching for place:', searchQuery);

    const response = await fetch(
      `https://google-maps-api-free.p.rapidapi.com/google-find-place-search?place=${encodeURIComponent(searchQuery)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'google-maps-api-free.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey,
        },
      }
    );

    if (!response.ok) {
      console.error('RapidAPI error:', response.status, await response.text());
      return new Response(JSON.stringify({ error: 'Failed to fetch place data' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('RapidAPI response:', JSON.stringify(data));

    // Extract relevant place info
    let placeInfo = null;
    if (data.candidates && data.candidates.length > 0) {
      const place = data.candidates[0];
      placeInfo = {
        name: place.name || null,
        formatted_address: place.formatted_address || null,
        place_id: place.place_id || null,
        photos: place.photos || [],
        geometry: place.geometry || null,
      };
    } else if (data.results && data.results.length > 0) {
      const place = data.results[0];
      placeInfo = {
        name: place.name || null,
        formatted_address: place.formatted_address || null,
        place_id: place.place_id || null,
        photos: place.photos || [],
        geometry: place.geometry || null,
      };
    }

    // Generate Street View static image URL
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${lat},${lng}&heading=0&pitch=0&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`;

    return new Response(JSON.stringify({
      place: placeInfo,
      streetViewUrl,
      coordinates: { lat, lng },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in place-info function:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
