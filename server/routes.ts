import type { Express } from "express";
import { createServer, type Server } from "node:http";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/places/autocomplete", async (req, res) => {
    const query = (req.query.q as string) || "";
    if (!query || query.length < 2) {
      return res.json({ results: [] });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      try {
        const searchBody = {
          textQuery: query,
          maxResultCount: 10,
        };
        const searchRes = await fetch(
          "https://places.googleapis.com/v1/places:searchText",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.types",
            },
            body: JSON.stringify(searchBody),
          }
        );
        const searchData = await searchRes.json();

        if (searchData.places && searchData.places.length > 0) {
          const results = searchData.places.map((place: any) => ({
            name: place.displayName?.text || query,
            address: place.formattedAddress || "",
            lat: place.location?.latitude || 0,
            lng: place.location?.longitude || 0,
            types: place.types || [],
          }));
          return res.json({ results, source: "google" });
        }

        if (searchData.error) {
          console.log("Google Places API not available, using Nominatim fallback");
        }
      } catch (e) {
        console.error("Google Places error:", e);
      }
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`;
      const response = await fetch(url, {
        headers: { "User-Agent": "LoKateApp/1.0" },
      });
      const data = await response.json();
      const results = data.map((item: any) => {
        const parts = (item.display_name || "").split(", ");
        return {
          name: parts[0] || item.name || query,
          address: parts.slice(1, 4).join(", ") || item.display_name || "",
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          types: [item.type, item.class].filter(Boolean),
        };
      });
      return res.json({ results, source: "nominatim" });
    } catch (e) {
      console.error("Nominatim error:", e);
      return res.json({ results: [], source: "error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
