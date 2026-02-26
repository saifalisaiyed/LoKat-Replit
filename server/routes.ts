import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { storage, verifyPassword, hashPassword } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { getUncachableStripeClient } from "./stripeClient";

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

async function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
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
      const { phone, password } = req.body;
      if (!phone || !phone.trim()) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const cleanPhone = phone.trim().replace(/[^0-9+\-() ]/g, "");
      const existingPhone = await storage.getUserByPhone(cleanPhone);
      if (existingPhone) {
        return res.status(409).json({ message: "An account with this phone number already exists" });
      }
      const username = "user_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const user = await storage.createUser({
        username,
        email: "",
        phone: cleanPhone,
        password,
        displayName: "LoKater",
      });
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
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      if (!user || !verifyPassword(password, user.password)) {
        return res.status(401).json({ message: "Invalid email or password" });
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
      const { displayName, email, phone } = req.body;
      const updates: Record<string, string> = {};
      if (displayName && displayName.trim()) updates.displayName = displayName.trim();
      if (email && email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          return res.status(400).json({ message: "Please enter a valid email address" });
        }
        const existing = await storage.getUserByEmail(email.toLowerCase().trim());
        if (existing && existing.id !== req.session.userId) {
          return res.status(409).json({ message: "This email is already in use" });
        }
        updates.email = email.toLowerCase().trim();
      }
      if (phone && phone.trim()) {
        const cleanPhone = phone.trim().replace(/[^0-9+\-() ]/g, "");
        const existingPhone = await storage.getUserByPhone(cleanPhone);
        if (existingPhone && existingPhone.id !== req.session.userId) {
          return res.status(409).json({ message: "This phone number is already in use" });
        }
        updates.phone = cleanPhone;
      }
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No updates provided" });
      }
      const user = await storage.updateUserProfile(req.session.userId!, updates);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (e) {
      return res.status(500).json({ message: "Update failed" });
    }
  });

  app.post("/api/auth/change-password", requireAuth, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (!verifyPassword(currentPassword, user.password)) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      const hashed = hashPassword(newPassword);
      const ok = await storage.changePassword(user.id, hashed);
      if (!ok) return res.status(500).json({ message: "Failed to change password" });
      return res.json({ message: "Password changed successfully" });
    } catch (e) {
      return res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.get("/api/requests", async (req: Request, res: Response) => {
    try {
      const requests = await storage.getRequests();
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radius = parseFloat(req.query.radius as string);
      if (!isNaN(lat) && !isNaN(lng) && !isNaN(radius) && radius > 0) {
        const filtered = requests.filter((r) => {
          const dLat = ((r.latitude - lat) * Math.PI) / 180;
          const dLng = ((r.longitude - lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat * Math.PI) / 180) *
              Math.cos((r.latitude * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distKm = 6371 * c;
          return distKm <= radius;
        });
        return res.json(filtered);
      }
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

  app.post("/api/ratings", requireAuth, async (req: Request, res: Response) => {
    try {
      const { requestId, toUserId, score, comment } = req.body;
      if (!requestId || !toUserId || !score) {
        return res.status(400).json({ message: "requestId, toUserId, and score are required" });
      }
      if (score < 1 || score > 5) {
        return res.status(400).json({ message: "Score must be between 1 and 5" });
      }
      const existing = await storage.getRatingByRequestAndUser(requestId, req.session.userId!);
      if (existing) {
        return res.status(409).json({ message: "You already rated this request" });
      }
      const request = await storage.getRequestById(requestId);
      if (!request || request.status !== "completed") {
        return res.status(400).json({ message: "Can only rate completed requests" });
      }
      const rating = await storage.createRating(requestId, req.session.userId!, toUserId, score, comment);
      return res.status(201).json(rating);
    } catch (e) {
      console.error("Rating error:", e);
      return res.status(500).json({ message: "Failed to create rating" });
    }
  });

  app.get("/api/ratings/:userId", async (req: Request, res: Response) => {
    try {
      const ratings = await storage.getRatingsForUser(paramId(req));
      return res.json(ratings);
    } catch (e) {
      return res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  app.get("/api/ratings/check/:requestId", requireAuth, async (req: Request, res: Response) => {
    try {
      const rating = await storage.getRatingByRequestAndUser(paramId(req), req.session.userId!);
      return res.json({ rated: !!rating, rating: rating || null });
    } catch (e) {
      return res.status(500).json({ message: "Failed to check rating" });
    }
  });

  app.get("/api/messages/:requestId", requireAuth, async (req: Request, res: Response) => {
    try {
      const request = await storage.getRequestById(paramId(req));
      if (!request) return res.status(404).json({ message: "Request not found" });
      if (request.creatorId !== req.session.userId && request.acceptedBy !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to view messages" });
      }
      if (request.status !== "accepted") {
        return res.status(403).json({ message: "Chat is only available while the request is active" });
      }
      const msgs = await storage.getMessages(paramId(req));
      return res.json(msgs);
    } catch (e) {
      return res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages/:requestId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ message: "Message text is required" });
      }
      const request = await storage.getRequestById(paramId(req));
      if (!request) return res.status(404).json({ message: "Request not found" });
      if (request.status !== "accepted") {
        return res.status(403).json({ message: "Chat is only available while the request is active" });
      }
      if (request.creatorId !== req.session.userId && request.acceptedBy !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to send messages" });
      }
      const msg = await storage.createMessage(paramId(req), req.session.userId!, text.trim());
      const recipientId = req.session.userId === request.creatorId ? request.acceptedBy : request.creatorId;
      if (recipientId) {
        const senderLabel = req.session.userId === request.creatorId ? "Seeker" : "LoKater";
        await storage.createNotification(
          recipientId,
          "New message",
          `${senderLabel}: ${text.trim().substring(0, 50)}`,
          "message",
          request.id,
        );
      }
      return res.status(201).json(msg);
    } catch (e) {
      return res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/directions", async (req: Request, res: Response) => {
    const { originLat, originLng, destLat, destLng } = req.query as Record<string, string>;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey || !originLat || !originLng || !destLat || !destLng) {
      return res.json({ polyline: [] });
    }
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=walking&key=${apiKey}`;
      const resp = await fetch(url);
      const data: any = await resp.json();
      if (data.status !== "OK" || !data.routes?.length) {
        return res.json({ polyline: [] });
      }
      const encoded: string = data.routes[0].overview_polyline.points;
      const polyline: { latitude: number; longitude: number }[] = [];
      let index = 0, lat = 0, lng = 0;
      while (index < encoded.length) {
        let b: number, shift = 0, result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lat += (result & 1) ? ~(result >> 1) : result >> 1;
        shift = 0; result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lng += (result & 1) ? ~(result >> 1) : result >> 1;
        polyline.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
      }
      return res.json({ polyline });
    } catch (e) {
      console.error("Directions error:", e);
      return res.json({ polyline: [] });
    }
  });

  app.get("/api/profile/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(paramId(req));
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.json({
        id: user.id,
        displayName: user.displayName,
        requestsCreated: user.requestsCreated,
        requestsFulfilled: user.requestsFulfilled,
        averageRating: user.averageRating,
        totalRatings: user.totalRatings,
        createdAt: user.createdAt,
      });
    } catch (e) {
      return res.status(500).json({ message: "Failed to fetch profile" });
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

  app.post("/api/objects/upload", requireAuth, async (req: Request, res: Response) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (e) {
      console.error("Upload URL error:", e);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put("/api/photos/submit", requireAuth, async (req: Request, res: Response) => {
    try {
      const { requestId, uploadURL } = req.body;
      if (!requestId || !uploadURL) {
        return res.status(400).json({ error: "requestId and uploadURL are required" });
      }
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        uploadURL,
        {
          owner: req.session.userId!,
          visibility: "public",
        },
      );
      const request = await storage.submitPhoto(requestId, objectPath);
      if (!request) return res.status(400).json({ message: "Cannot submit photo" });
      return res.json(request);
    } catch (e) {
      console.error("Photo submit error:", e);
      return res.status(500).json({ error: "Failed to submit photo" });
    }
  });

  app.get(/^\/objects\/(.+)$/, async (req: Request, res: Response) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: req.session.userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      console.error("Object access error:", error);
      return res.sendStatus(500);
    }
  });

  app.get("/api/admin/requests", requireAdmin, async (req: Request, res: Response) => {
    try {
      const statusFilter = req.query.status as string | undefined;
      const allRequests = await storage.getAllRequestsAdmin(statusFilter);
      return res.json(allRequests);
    } catch (e) {
      console.error("Admin requests error:", e);
      return res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const allUsers = await storage.getAllUsersAdmin();
      return res.json(allUsers.map(u => {
        const { password: _, ...safe } = u;
        return safe;
      }));
    } catch (e) {
      console.error("Admin users error:", e);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getAdminStats();
      return res.json(stats);
    } catch (e) {
      return res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get(/^\/public-objects\/(.+)$/, async (req: Request, res: Response) => {
    const filePath = req.path.replace("/public-objects/", "");
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Public object error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Payment: complete photo submission and process payout
  app.post("/api/payments/complete-submission", requireAuth, async (req: Request, res: Response) => {
    try {
      const { requestId, latitude, longitude } = req.body;
      if (!requestId) return res.status(400).json({ message: "requestId required" });

      const request = await storage.getRequestById(requestId);
      if (!request) return res.status(404).json({ message: "Request not found" });
      if (request.acceptedBy !== req.session.userId) {
        return res.status(403).json({ message: "Not your request" });
      }
      if (request.status !== "submitted") {
        return res.status(400).json({ message: "Request must be in submitted state" });
      }

      // Server-side location verification: reject if photo taken too far from target
      if (typeof latitude === "number" && typeof longitude === "number") {
        const toRad = (d: number) => (d * Math.PI) / 180;
        const R = 6371e3;
        const dLat = toRad(request.latitude - latitude);
        const dLon = toRad(request.longitude - longitude);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(latitude)) * Math.cos(toRad(request.latitude)) * Math.sin(dLon / 2) ** 2;
        const distanceMeters = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (distanceMeters > 300) {
          return res.status(400).json({
            message: `Photo was taken ${Math.round(distanceMeters)}m from the target. Must be within 300m.`,
            code: "TOO_FAR",
            distanceMeters: Math.round(distanceMeters),
          });
        }
      }

      const lokater = await storage.getUser(req.session.userId!);
      if (!lokater) return res.status(404).json({ message: "User not found" });

      let stripePaymentIntentId: string | undefined;
      try {
        const stripe = await getUncachableStripeClient();

        // Ensure seeker has a Stripe customer record
        const seeker = await storage.getUser(request.creatorId);
        let customerId = seeker?.stripeCustomerId;
        if (!customerId && seeker) {
          const customer = await stripe.customers.create({
            email: seeker.email || `${seeker.username}@lokat.app`,
            metadata: { userId: seeker.id, platform: "lokat" },
          });
          customerId = customer.id;
          await storage.updateUserStripeCustomerId(seeker.id, customerId);
        }

        // Create a PaymentIntent as the earnings record for this job
        const amountCents = Math.round(request.reward * 100);
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountCents,
          currency: "usd",
          customer: customerId || undefined,
          payment_method_types: ["card"],
          confirm: false,
          metadata: {
            requestId: request.id,
            lokaterId: req.session.userId!,
            locationName: request.locationName,
            platform: "lokat",
          },
          description: `LoKat payout: ${request.locationName} photo by ${lokater.displayName}`,
        });

        stripePaymentIntentId = paymentIntent.id;
      } catch (stripeErr: any) {
        console.error("Stripe PaymentIntent error (non-fatal):", stripeErr.message);
      }

      // Complete the request and credit earnings
      const completed = await storage.completeRequestWithPayment(requestId, stripePaymentIntentId);
      if (!completed) return res.status(400).json({ message: "Could not complete request" });

      // Get updated user for new balance
      const updatedUser = await storage.getUser(req.session.userId!);

      return res.json({
        request: completed,
        earned: request.reward,
        newBalance: updatedUser?.earnings ?? 0,
        stripePaymentIntentId,
      });
    } catch (e: any) {
      console.error("Payment complete error:", e);
      return res.status(500).json({ message: "Payment processing failed" });
    }
  });

  // Stripe publishable key for client
  app.get("/api/stripe/publishable-key", async (_req: Request, res: Response) => {
    try {
      const { getStripePublishableKey } = await import("./stripeClient");
      const key = await getStripePublishableKey();
      return res.json({ publishableKey: key });
    } catch (e) {
      return res.status(500).json({ message: "Could not get Stripe key" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
