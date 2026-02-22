import { eq, desc, and, or, ne, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  photoRequests,
  notifications,
  type User,
  type InsertUser,
  type PhotoRequest,
  type InsertPhotoRequest,
  type Notification,
} from "@shared/schema";
import { randomUUID } from "crypto";
import * as crypto from "crypto";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  updateUserProfile(id: string, data: { displayName?: string; email?: string; phone?: string }): Promise<User | undefined>;
  changePassword(id: string, newPasswordHash: string): Promise<boolean>;
  incrementUserStat(id: string, field: "requestsCreated" | "requestsFulfilled", amount?: number): Promise<void>;
  addUserEarnings(id: string, amount: number): Promise<void>;

  getRequests(): Promise<PhotoRequest[]>;
  getRequestById(id: string): Promise<PhotoRequest | undefined>;
  getRequestsByUser(userId: string): Promise<PhotoRequest[]>;
  createRequest(userId: string, data: InsertPhotoRequest): Promise<PhotoRequest>;
  acceptRequest(id: string, userId: string): Promise<PhotoRequest | undefined>;
  abandonRequest(id: string): Promise<PhotoRequest | undefined>;
  submitPhoto(id: string, photoUri: string): Promise<PhotoRequest | undefined>;
  completeRequest(id: string): Promise<PhotoRequest | undefined>;
  deleteRequest(id: string, userId: string): Promise<boolean>;

  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(userId: string, title: string, body: string, type: string, requestId?: string): Promise<Notification>;
  markNotificationRead(id: string, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = hashPassword(insertUser.password);
    const [user] = await db
      .insert(users)
      .values({
        id,
        username: insertUser.username,
        email: insertUser.email || "",
        phone: insertUser.phone || "",
        password: hashedPassword,
        displayName: insertUser.displayName || insertUser.username,
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, data: { displayName?: string; email?: string; phone?: string }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async changePassword(id: string, newPasswordHash: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ password: newPasswordHash })
      .where(eq(users.id, id))
      .returning();
    return result.length > 0;
  }

  async incrementUserStat(id: string, field: "requestsCreated" | "requestsFulfilled", amount = 1): Promise<void> {
    const col = field === "requestsCreated" ? users.requestsCreated : users.requestsFulfilled;
    await db
      .update(users)
      .set({ [field]: sql`${col} + ${amount}` })
      .where(eq(users.id, id));
  }

  async addUserEarnings(id: string, amount: number): Promise<void> {
    await db
      .update(users)
      .set({ earnings: sql`${users.earnings} + ${amount}` })
      .where(eq(users.id, id));
  }

  async getRequests(): Promise<PhotoRequest[]> {
    return db.select().from(photoRequests).orderBy(desc(photoRequests.createdAt));
  }

  async getRequestById(id: string): Promise<PhotoRequest | undefined> {
    const [req] = await db.select().from(photoRequests).where(eq(photoRequests.id, id));
    return req;
  }

  async getRequestsByUser(userId: string): Promise<PhotoRequest[]> {
    return db
      .select()
      .from(photoRequests)
      .where(or(eq(photoRequests.creatorId, userId), eq(photoRequests.acceptedBy, userId)))
      .orderBy(desc(photoRequests.createdAt));
  }

  async createRequest(userId: string, data: InsertPhotoRequest): Promise<PhotoRequest> {
    const id = randomUUID();
    const [req] = await db
      .insert(photoRequests)
      .values({
        id,
        creatorId: userId,
        latitude: data.latitude,
        longitude: data.longitude,
        locationName: data.locationName,
        address: data.address || "",
        category: data.category || "landmarks",
        orientation: data.orientation || "portrait",
        angle: data.angle || "eye-level",
        timing: data.timing || "now",
        scheduledTime: data.scheduledTime,
        reward: data.reward || 5,
        note: data.note,
        status: "open",
      })
      .returning();
    await this.incrementUserStat(userId, "requestsCreated");
    return req;
  }

  async acceptRequest(id: string, userId: string): Promise<PhotoRequest | undefined> {
    const [req] = await db
      .update(photoRequests)
      .set({ status: "accepted", acceptedBy: userId })
      .where(and(eq(photoRequests.id, id), eq(photoRequests.status, "open")))
      .returning();
    if (req) {
      await this.createNotification(
        userId,
        "Request accepted",
        `You accepted the request for ${req.locationName}`,
        "accepted",
        id,
      );
    }
    return req;
  }

  async abandonRequest(id: string): Promise<PhotoRequest | undefined> {
    const [req] = await db
      .update(photoRequests)
      .set({ status: "open", acceptedBy: null })
      .where(and(eq(photoRequests.id, id), eq(photoRequests.status, "accepted")))
      .returning();
    return req;
  }

  async submitPhoto(id: string, photoUri: string): Promise<PhotoRequest | undefined> {
    const [req] = await db
      .update(photoRequests)
      .set({
        status: "submitted",
        photoUri,
        submittedAt: new Date().toISOString(),
      })
      .where(eq(photoRequests.id, id))
      .returning();
    if (req) {
      await this.createNotification(
        req.acceptedBy || req.creatorId,
        "Photo submitted",
        `Photo for ${req.locationName} has been submitted`,
        "submitted",
        id,
      );
    }
    return req;
  }

  async completeRequest(id: string): Promise<PhotoRequest | undefined> {
    const [req] = await db
      .update(photoRequests)
      .set({ status: "completed" })
      .where(eq(photoRequests.id, id))
      .returning();
    if (req && req.acceptedBy) {
      await this.addUserEarnings(req.acceptedBy, req.reward);
      await this.incrementUserStat(req.acceptedBy, "requestsFulfilled");
      await this.createNotification(
        req.acceptedBy,
        "Payment received",
        `You earned $${req.reward.toFixed(2)} for ${req.locationName}`,
        "completed",
        id,
      );
    }
    return req;
  }

  async deleteRequest(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(photoRequests)
      .where(and(eq(photoRequests.id, id), eq(photoRequests.creatorId, userId)))
      .returning();
    return result.length > 0;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(userId: string, title: string, body: string, type: string, requestId?: string): Promise<Notification> {
    const id = randomUUID();
    const [notif] = await db
      .insert(notifications)
      .values({ id, userId, title, body, type, requestId })
      .returning();
    return notif;
  }

  async markNotificationRead(id: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return result?.count || 0;
  }
}

export const storage = new DatabaseStorage();
