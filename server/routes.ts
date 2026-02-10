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
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        const results = (data.results || []).slice(0, 10).map((place: any) => ({
          name: place.name || query,
          address: place.formatted_address || "",
          lat: place.geometry?.location?.lat || 0,
          lng: place.geometry?.location?.lng || 0,
          types: place.types || [],
        }));
        return res.json({ results, source: "google" });
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
