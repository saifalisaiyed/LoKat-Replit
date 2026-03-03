import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import * as fs from "fs";
import * as path from "path";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { storage, verifyPassword, hashPassword } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { getUncachableResendClient } from "./resend";

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

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (userId) {
      await storage.releaseAcceptedRequestsByUser(userId).catch(() => {});
    }
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.post("/api/auth/push-token", requireAuth, async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "token is required" });
      }
      await storage.updateUserPushToken(req.session.userId!, token);
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ message: "Failed to register push token" });
    }
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      const user = await storage.getUserByEmail(email.trim().toLowerCase());
      if (!user) {
        return res.json({ ok: true });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 15 * 60 * 1000);
      await storage.setResetToken(user.id, otp, expiry);

      try {
        const { client, fromEmail } = await getUncachableResendClient();
        await client.emails.send({
          from: fromEmail,
          to: email.trim(),
          subject: "Your LoKat password reset code",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0A0F1C;color:#fff;border-radius:12px">
              <h2 style="color:#7C3AED;margin-top:0">Reset your password</h2>
              <p style="color:#aaa">Use this code to reset your LoKat password. It expires in 15 minutes.</p>
              <div style="background:#1A1B2E;border:1px solid #7C3AED;border-radius:8px;padding:24px;text-align:center;letter-spacing:12px;font-size:32px;font-weight:bold;color:#7C3AED;margin:24px 0">${otp}</div>
              <p style="color:#666;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
            </div>`,
        });
      } catch (emailErr) {
        console.error("Resend error:", emailErr);
      }

      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: "Email, code, and new password are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const user = await storage.getUserByEmail(email.trim().toLowerCase());
      if (!user || !user.resetToken || !user.resetTokenExpiry) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }
      if (user.resetToken !== otp.trim()) {
        return res.status(400).json({ message: "Invalid code" });
      }
      if (new Date() > new Date(user.resetTokenExpiry)) {
        return res.status(400).json({ message: "Code has expired. Please request a new one." });
      }

      const crypto = await import("crypto");
      const hashed = crypto.createHash("sha256").update(newPassword.trim()).digest("hex");
      await storage.resetUserPassword(user.id, hashed);

      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ message: "Server error" });
    }
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
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      const hashed = hashPassword(newPassword);
      const ok = await storage.changePassword(user.id, hashed);
      if (!ok) return res.status(500).json({ message: "Failed to change password" });
      return res.json({ message: "Password changed successfully" });
    } catch (e) {
      return res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.post("/api/feedback", requireAuth, async (req: Request, res: Response) => {
    try {
      const { type, message, senderName } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }
      const feedbackType = type === "bug" ? "Bug Report" : "Feedback";
      const sender = senderName?.trim() || "Anonymous";
      const currentUser = await storage.getUser(req.session.userId!);
      const userEmail = currentUser?.email || "Not provided";

      try {
        const { client: resend, fromEmail } = await getUncachableResendClient();
        await resend.emails.send({
          from: `LoKat App <${fromEmail}>`,
          to: ["lokat.official@gmail.com"],
          subject: `[LoKat ${feedbackType}] from ${sender}`,
          html: `
            <h2>New ${feedbackType} from LoKat App</h2>
            <p><strong>From:</strong> ${sender}</p>
            <p><strong>Account Email:</strong> ${userEmail}</p>
            <p><strong>Type:</strong> ${feedbackType}</p>
            <hr/>
            <p><strong>Message:</strong></p>
            <p>${message.trim().replace(/\n/g, "<br/>")}</p>
            <hr/>
            <p style="color:#888;font-size:12px;">Sent from LoKat mobile app</p>
          `,
        });
      } catch (emailErr) {
        console.error("Resend email error:", emailErr);
        console.log(`[FEEDBACK] ${feedbackType} from ${sender} (${userEmail}): ${message.trim()}`);
      }

      return res.json({ message: "Feedback sent successfully" });
    } catch (e) {
      console.error("Feedback error:", e);
      return res.status(500).json({ message: "Failed to send feedback" });
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
      const { sendPushToUsers } = await import("./pushNotifications");
      const otherUserIds = await storage.getAllUserIdsExcept(req.session.userId!);
      if (otherUserIds.length > 0) {
        sendPushToUsers(
          otherUserIds,
          "New photo request nearby 📍",
          `$${Number(req.body.reward || 5).toFixed(2)} — ${req.body.locationName || "A new location"}`,
          { type: "new_request", requestId: request.id },
        ).catch(() => {});
      }
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

  app.patch("/api/requests/:id/note", requireAuth, async (req: Request, res: Response) => {
    try {
      const { note } = req.body;
      if (typeof note !== "string") return res.status(400).json({ message: "note must be a string" });
      const updated = await storage.updateRequestNote(paramId(req), req.session.userId!, note.trim());
      if (!updated) return res.status(404).json({ message: "Request not found or not yours" });
      return res.json(updated);
    } catch (e) {
      return res.status(500).json({ message: "Failed to update note" });
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
        const sender = await storage.getUser(req.session.userId!);
        const senderName = sender?.displayName || (req.session.userId === request.creatorId ? "Seeker" : "LoKater");
        const preview = text.trim().substring(0, 60);
        await storage.createNotification(
          recipientId,
          `Message from ${senderName}`,
          preview,
          "message",
          request.id,
        );
        const { sendPushToUser } = await import("./pushNotifications");
        await sendPushToUser(
          recipientId,
          `💬 ${senderName}`,
          preview,
          { requestId: request.id, type: "message" },
        );
      }
      return res.status(201).json(msg);
    } catch (e) {
      return res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/directions", async (req: Request, res: Response) => {
    const { originLat, originLng, destLat, destLng } = req.query as Record<string, string>;
    if (!originLat || !originLng || !destLat || !destLng) {
      return res.json({ polyline: [] });
    }

    function decodeGooglePolyline(encoded: string): { latitude: number; longitude: number }[] {
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
      return polyline;
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=walking&key=${apiKey}`;
        const resp = await fetch(url);
        const data: any = await resp.json();
        if (data.status === "OK" && data.routes?.length) {
          const polyline = decodeGooglePolyline(data.routes[0].overview_polyline.points);
          return res.json({ polyline });
        }
        console.log("Google Directions status:", data.status, "— falling back to OSRM");
      } catch (e) {
        console.log("Google Directions failed, falling back to OSRM:", e);
      }
    }

    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
      const resp = await fetch(osrmUrl);
      const data: any = await resp.json();
      if (data.code === "Ok" && data.routes?.length) {
        const coords: [number, number][] = data.routes[0].geometry.coordinates;
        const polyline = coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
        return res.json({ polyline });
      }
      console.log("OSRM also failed:", data.code);
    } catch (e) {
      console.error("OSRM error:", e);
    }

    return res.json({ polyline: [] });
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

  app.get("/api/reverse-geocode", async (req: Request, res: Response) => {
    const { lat, lng } = req.query as { lat: string; lng: string };
    if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
      const response = await fetch(url, { headers: { "User-Agent": "LoKatApp/1.0" } });
      const data = await response.json();
      const parts = (data.display_name || "").split(", ");
      const name = data.address?.road || data.address?.neighbourhood || data.address?.suburb || parts[0] || "Selected Location";
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
      const state = data.address?.state || "";
      const country = data.address?.country_code?.toUpperCase() || "";
      const address = [city, state, country].filter(Boolean).join(", ") || parts.slice(1, 4).join(", ") || data.display_name || "";
      return res.json({ name, address });
    } catch (e) {
      console.error("Reverse geocode error:", e);
      return res.json({ name: "Selected Location", address: "" });
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

  app.delete("/api/admin/requests", requireAdmin, async (req: Request, res: Response) => {
    try {
      const count = await storage.deleteAllRequests();
      return res.json({ deleted: count });
    } catch (e) {
      console.error("Admin delete requests error:", e);
      return res.status(500).json({ message: "Failed to delete requests" });
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
        if (distanceMeters > 100) {
          return res.status(400).json({
            message: `Photo was taken ${Math.round(distanceMeters)}m from the target. Must be within 100m.`,
            code: "TOO_FAR",
            distanceMeters: Math.round(distanceMeters),
          });
        }
      }

      const lokater = await storage.getUser(req.session.userId!);
      if (!lokater) return res.status(404).json({ message: "User not found" });

      // Charge the seeker's saved card via Stripe
      const stripe = await getUncachableStripeClient();
      const seeker = await storage.getUser(request.creatorId);

      if (!seeker?.stripeCustomerId) {
        return res.status(402).json({
          message: "Seeker has no payment method on file.",
          code: "NO_PAYMENT_METHOD",
        });
      }

      // Find the seeker's saved card
      const paymentMethods = await stripe.paymentMethods.list({
        customer: seeker.stripeCustomerId,
        type: "card",
        limit: 1,
      });

      if (paymentMethods.data.length === 0) {
        return res.status(402).json({
          message: "Seeker has no card on file.",
          code: "NO_PAYMENT_METHOD",
        });
      }

      const paymentMethodId = paymentMethods.data[0].id;
      const amountCents = Math.round(request.reward * 100);

      // Confirm the charge off-session (seeker is not present)
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: amountCents,
          currency: "usd",
          customer: seeker.stripeCustomerId,
          payment_method: paymentMethodId,
          confirm: true,
          off_session: true,
          description: `LoKat: ${request.locationName} by ${lokater.displayName}`,
          metadata: {
            requestId: request.id,
            lokaterId: req.session.userId!,
            seekerId: request.creatorId,
            platform: "lokat",
          },
        });
      } catch (stripeErr: any) {
        console.error("Stripe charge failed:", stripeErr.message);
        const code = stripeErr.code || "PAYMENT_FAILED";
        return res.status(402).json({
          message: "Payment could not be processed. The seeker may need to update their card.",
          code,
          stripeError: stripeErr.message,
        });
      }

      if (paymentIntent.status !== "succeeded") {
        return res.status(402).json({
          message: "Payment was not confirmed. Please try again.",
          code: "PAYMENT_NOT_CONFIRMED",
          paymentIntentStatus: paymentIntent.status,
        });
      }

      // Complete the request and credit LoKater earnings
      const completed = await storage.completeRequestWithPayment(requestId, paymentIntent.id);
      if (!completed) return res.status(400).json({ message: "Could not complete request" });

      // Get updated user for new balance
      const updatedUser = await storage.getUser(req.session.userId!);

      return res.json({
        request: completed,
        earned: request.reward,
        newBalance: updatedUser?.earnings ?? 0,
        stripePaymentIntentId: paymentIntent.id,
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

  // Create a SetupIntent so the frontend can collect card details natively
  app.post("/api/payments/create-setup-intent", requireAuth, async (req: Request, res: Response) => {
    try {
      const stripe = await getUncachableStripeClient();
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ message: "User not found" });

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || `${user.username}@lokat.app`,
          metadata: { userId: user.id, platform: "lokat" },
        });
        customerId = customer.id;
        await storage.updateUserStripeCustomerId(user.id, customerId);
      }

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ["card"],
        usage: "off_session",
        metadata: { userId: user.id, platform: "lokat" },
      });

      const publishableKey = await getStripePublishableKey();

      return res.json({
        clientSecret: setupIntent.client_secret,
        publishableKey,
      });
    } catch (e: any) {
      console.error("Create setup intent error:", e.message);
      return res.status(500).json({ message: "Failed to create setup intent" });
    }
  });

  // Serve the in-app card setup HTML page (used by WebView)
  app.get("/card-setup", (_req: Request, res: Response) => {
    try {
      const templatePath = path.resolve(process.cwd(), "server", "templates", "card-setup.html");
      const html = fs.readFileSync(templatePath, "utf-8");
      res.setHeader("Content-Type", "text/html");
      return res.send(html);
    } catch (e) {
      return res.status(500).send("Card setup page not found");
    }
  });

  // Create a Stripe Checkout session in setup mode so the seeker can save a card
  app.post("/api/payments/setup-session", requireAuth, async (req: Request, res: Response) => {
    try {
      const stripe = await getUncachableStripeClient();
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ message: "User not found" });

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || `${user.username}@lokat.app`,
          metadata: { userId: user.id, platform: "lokat" },
        });
        customerId = customer.id;
        await storage.updateUserStripeCustomerId(user.id, customerId);
      }

      const domain = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "http://localhost:5000";

      const session = await stripe.checkout.sessions.create({
        mode: "setup",
        customer: customerId,
        currency: "usd",
        success_url: `${domain}/payment-success`,
        cancel_url: `${domain}/payment-cancel`,
      });

      return res.json({ url: session.url, sessionId: session.id });
    } catch (e: any) {
      console.error("Setup session error:", e.message);
      return res.status(500).json({ message: "Failed to create payment setup session" });
    }
  });

  // Check whether the authed user has a saved payment method
  app.get("/api/payments/payment-status", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ message: "User not found" });

      let hasPaymentMethod = user.hasPaymentMethod;

      // Verify with Stripe if we haven't flagged it yet
      if (!hasPaymentMethod && user.stripeCustomerId) {
        try {
          const stripe = await getUncachableStripeClient();
          const methods = await stripe.paymentMethods.list({
            customer: user.stripeCustomerId,
            type: "card",
            limit: 1,
          });
          if (methods.data.length > 0) {
            hasPaymentMethod = true;
            await storage.setHasPaymentMethod(user.id);
          }
        } catch (_) {}
      }

      return res.json({ hasPaymentMethod, payoutInfo: user.payoutInfo });
    } catch (e: any) {
      return res.status(500).json({ message: "Failed to check payment status" });
    }
  });

  // Save LoKater payout info
  app.patch("/api/auth/payout-info", requireAuth, async (req: Request, res: Response) => {
    try {
      const { payoutInfo } = req.body;
      if (!payoutInfo || typeof payoutInfo !== "string") {
        return res.status(400).json({ message: "payoutInfo is required" });
      }
      await storage.updatePayoutInfo(req.session.userId!, payoutInfo);
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ message: "Failed to save payout info" });
    }
  });

  // Simple HTML pages Stripe redirects to after setup
  app.get("/payment-success", (_req: Request, res: Response) => {
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Card Saved</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#1A1B2E;color:#fff;text-align:center;padding:20px}
.icon{font-size:64px;margin-bottom:16px}.title{font-size:24px;font-weight:700;margin-bottom:8px}.sub{color:#A1A1AA;font-size:16px}</style></head>
<body><div><div class="icon">✅</div><div class="title">Card saved!</div>
<div class="sub">You can close this window and return to LoKat.</div></div></body></html>`);
  });

  app.get("/payment-cancel", (_req: Request, res: Response) => {
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cancelled</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#1A1B2E;color:#fff;text-align:center;padding:20px}
.icon{font-size:64px;margin-bottom:16px}.title{font-size:24px;font-weight:700;margin-bottom:8px}.sub{color:#A1A1AA;font-size:16px}</style></head>
<body><div><div class="icon">↩️</div><div class="title">Cancelled</div>
<div class="sub">You can close this window and return to LoKat.</div></div></body></html>`);
  });

  const httpServer = createServer(app);
  return httpServer;
}
