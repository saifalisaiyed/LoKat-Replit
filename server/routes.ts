import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { storage, verifyPassword } from "./storage";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

function getSessionStore() {
  const PgStore = pgSession(session);
  return new PgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: "user_sessions",
  });
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

function paramId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(
    session({
      store: getSessionStore(),
      secret: process.env.SESSION_SECRET || "lokate-dev-secret-change-me",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      },
    }),
  );

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password, displayName } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      if (username.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters" });
      }
      if (password.length < 4) {
        return res.status(400).json({ message: "Password must be at least 4 characters" });
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "Username already taken" });
      }
      const user = await storage.createUser({ username, password, displayName: displayName || username });
      req.session.userId = user.id;
      const { password: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (e: any) {
      console.error("Register error:", e);
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user || !verifyPassword(password, user.password)) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.session.userId = user.id;
      const { password: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (e: any) {
      console.error("Login error:", e);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }
    const { password: _, ...safeUser } = user;
    return res.json({ user: safeUser });
  });

  app.patch("/api/auth/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.updateUserProfile(req.session.userId!, req.body);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (e) {
      return res.status(500).json({ message: "Update failed" });
    }
  });

  app.get("/api/requests", async (req: Request, res: Response) => {
    try {
      const requests = await storage.getRequests();
      return res.json(requests);
    } catch (e) {
      console.error("Get requests error:", e);
      return res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.get("/api/requests/mine", requireAuth, async (req: Request, res: Response) => {
    try {
      const requests = await storage.getRequestsByUser(req.session.userId!);
      return res.json(requests);
    } catch (e) {
      return res.status(500).json({ message: "Failed to fetch your requests" });
    }
  });

  app.get("/api/requests/:id", async (req: Request, res: Response) => {
    try {
      const request = await storage.getRequestById(paramId(req));
      if (!request) return res.status(404).json({ message: "Request not found" });
      return res.json(request);
    } catch (e) {
      return res.status(500).json({ message: "Failed to fetch request" });
    }
  });

  app.post("/api/requests", requireAuth, async (req: Request, res: Response) => {
    try {
      const request = await storage.createRequest(req.session.userId!, req.body);
      return res.status(201).json(request);
    } catch (e: any) {
      console.error("Create request error:", e);
      return res.status(500).json({ message: "Failed to create request" });
    }
  });

  app.patch("/api/requests/:id/accept", requireAuth, async (req: Request, res: Response) => {
    try {
      const request = await storage.acceptRequest(paramId(req), req.session.userId!);
      if (!request) return res.status(400).json({ message: "Cannot accept this request" });
      return res.json(request);
    } catch (e) {
      return res.status(500).json({ message: "Failed to accept request" });
    }
  });

  app.patch("/api/requests/:id/abandon", requireAuth, async (req: Request, res: Response) => {
    try {
      const request = await storage.abandonRequest(paramId(req));
      if (!request) return res.status(400).json({ message: "Cannot abandon this request" });
      return res.json(request);
    } catch (e) {
      return res.status(500).json({ message: "Failed to abandon request" });
    }
  });

  app.patch("/api/requests/:id/submit", requireAuth, async (req: Request, res: Response) => {
    try {
      const { photoUri } = req.body;
      if (!photoUri) return res.status(400).json({ message: "photoUri required" });
      const request = await storage.submitPhoto(paramId(req), photoUri);
      if (!request) return res.status(400).json({ message: "Cannot submit photo" });
      return res.json(request);
    } catch (e) {
      return res.status(500).json({ message: "Failed to submit photo" });
    }
  });

  app.patch("/api/requests/:id/complete", requireAuth, async (req: Request, res: Response) => {
    try {
      const request = await storage.completeRequest(paramId(req));
      if (!request) return res.status(400).json({ message: "Cannot complete request" });
      return res.json(request);
    } catch (e) {
      return res.status(500).json({ message: "Failed to complete request" });
    }
  });

  app.delete("/api/requests/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteRequest(paramId(req), req.session.userId!);
      if (!deleted) return res.status(404).json({ message: "Request not found or not yours" });
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ message: "Failed to delete request" });
    }
  });

  app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const notifs = await storage.getNotifications(req.session.userId!);
      return res.json(notifs);
    } catch (e) {
      return res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req: Request, res: Response) => {
    try {
      const count = await storage.getUnreadCount(req.session.userId!);
      return res.json({ count });
    } catch (e) {
      return res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.markNotificationRead(paramId(req), req.session.userId!);
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ message: "Failed to mark notification read" });
    }
  });

  app.patch("/api/notifications/read-all", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.markAllNotificationsRead(req.session.userId!);
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ message: "Failed to mark all read" });
    }
  });

  app.get("/api/places/autocomplete", async (req, res) => {
    const query = (req.query.q as string) || "";
    if (!query || query.length < 2) {
      return res.json({ results: [] });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      try {
        const tsUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
        const tsResponse = await fetch(tsUrl);
        const tsData = await tsResponse.json();

        if (tsData.status === "OK" && tsData.results?.length > 0) {
          const results = tsData.results.slice(0, 10).map((place: any) => ({
            name: place.name || query,
            address: place.formatted_address || "",
            lat: place.geometry?.location?.lat || 0,
            lng: place.geometry?.location?.lng || 0,
            types: place.types || [],
          }));
          return res.json({ results, source: "google" });
        }

        if (tsData.status !== "OK" && tsData.status !== "ZERO_RESULTS") {
          console.log("Google Places:", tsData.status, tsData.error_message || "");
        }
      } catch (e) {
        console.error("Google Places error:", e);
      }
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`;
      const response = await fetch(url, {
        headers: { "User-Agent": "LoKatApp/1.0" },
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
