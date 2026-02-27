import { eq, desc, and, or, ne, sql, asc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  photoRequests,
  notifications,
  ratings,
  messages,
  type User,
  type InsertUser,
  type PhotoRequest,
  type InsertPhotoRequest,
  type Notification,
  type Rating,
  type Message,
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
  updateRequestNote(id: string, userId: string, note: string): Promise<PhotoRequest | undefined>;

  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(userId: string, title: string, body: string, type: string, requestId?: string): Promise<Notification>;
  markNotificationRead(id: string, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;

  createRating(requestId: string, fromUserId: string, toUserId: string, score: number, comment?: string): Promise<Rating>;
  getRatingByRequestAndUser(requestId: string, fromUserId: string): Promise<Rating | undefined>;
  getRatingsForUser(userId: string): Promise<Rating[]>;

  getMessages(requestId: string): Promise<Message[]>;
  createMessage(requestId: string, senderId: string, text: string): Promise<Message>;

  getAllRequestsAdmin(statusFilter?: string): Promise<PhotoRequest[]>;
  deleteAllRequests(): Promise<number>;
  getAllUsersAdmin(): Promise<User[]>;
  getAdminStats(): Promise<{ totalUsers: number; totalRequests: number; openRequests: number; acceptedRequests: number; completedRequests: number; totalEarnings: number }>;
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
        req.creatorId,
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

  async completeRequestWithPayment(id: string, stripePaymentIntentId?: string): Promise<PhotoRequest | undefined> {
    const [req] = await db
      .update(photoRequests)
      .set({ status: "completed", ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}) })
      .where(and(eq(photoRequests.id, id), eq(photoRequests.status, "submitted")))
      .returning();
    if (req && req.acceptedBy) {
      await this.addUserEarnings(req.acceptedBy, req.reward);
      await this.incrementUserStat(req.acceptedBy, "requestsFulfilled");
      await this.createNotification(
        req.acceptedBy,
        "Payment received!",
        `$${req.reward.toFixed(2)} has been added to your balance for ${req.locationName}`,
        "completed",
        id,
      );
      await this.createNotification(
        req.creatorId,
        "Photo delivered",
        `Your photo of ${req.locationName} has been delivered!`,
        "completed",
        id,
      );
    }
    return req;
  }

  async updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
    await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId));
  }

  async deleteRequest(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(photoRequests)
      .where(and(eq(photoRequests.id, id), eq(photoRequests.creatorId, userId)))
      .returning();
    return result.length > 0;
  }

  async updateRequestNote(id: string, userId: string, note: string): Promise<PhotoRequest | undefined> {
    const [req] = await db
      .update(photoRequests)
      .set({ note: note || null })
      .where(and(eq(photoRequests.id, id), eq(photoRequests.creatorId, userId)))
      .returning();
    return req;
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

  async createRating(requestId: string, fromUserId: string, toUserId: string, score: number, comment?: string): Promise<Rating> {
    const id = randomUUID();
    const [rating] = await db
      .insert(ratings)
      .values({ id, requestId, fromUserId, toUserId, score, comment })
      .returning();
    const userRatings = await db
      .select({ avg: sql<number>`avg(score)::float`, count: sql<number>`count(*)::int` })
      .from(ratings)
      .where(eq(ratings.toUserId, toUserId));
    if (userRatings[0]) {
      await db
        .update(users)
        .set({
          averageRating: userRatings[0].avg || 0,
          totalRatings: userRatings[0].count || 0,
        })
        .where(eq(users.id, toUserId));
    }
    return rating;
  }

  async getRatingByRequestAndUser(requestId: string, fromUserId: string): Promise<Rating | undefined> {
    const [rating] = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.requestId, requestId), eq(ratings.fromUserId, fromUserId)));
    return rating;
  }

  async getRatingsForUser(userId: string): Promise<Rating[]> {
    return db
      .select()
      .from(ratings)
      .where(eq(ratings.toUserId, userId))
      .orderBy(desc(ratings.createdAt));
  }

  async getMessages(requestId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.requestId, requestId))
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(requestId: string, senderId: string, text: string): Promise<Message> {
    const id = randomUUID();
    const [msg] = await db
      .insert(messages)
      .values({ id, requestId, senderId, text })
      .returning();
    return msg;
  }

  async getAllRequestsAdmin(statusFilter?: string): Promise<PhotoRequest[]> {
    if (statusFilter && statusFilter !== "all") {
      return db
        .select()
        .from(photoRequests)
        .where(eq(photoRequests.status, statusFilter))
        .orderBy(desc(photoRequests.createdAt));
    }
    return db.select().from(photoRequests).orderBy(desc(photoRequests.createdAt));
  }

  async deleteAllRequests(): Promise<number> {
    const result = await db.delete(photoRequests);
    return result.rowCount ?? 0;
  }

  async getAllUsersAdmin(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAdminStats(): Promise<{ totalUsers: number; totalRequests: number; openRequests: number; acceptedRequests: number; completedRequests: number; totalEarnings: number }> {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [reqCount] = await db.select({ count: sql<number>`count(*)` }).from(photoRequests);
    const [openCount] = await db.select({ count: sql<number>`count(*)` }).from(photoRequests).where(eq(photoRequests.status, "open"));
    const [acceptedCount] = await db.select({ count: sql<number>`count(*)` }).from(photoRequests).where(eq(photoRequests.status, "accepted"));
    const [completedCount] = await db.select({ count: sql<number>`count(*)` }).from(photoRequests).where(eq(photoRequests.status, "completed"));
    const [earningsSum] = await db.select({ total: sql<number>`coalesce(sum(${users.earnings}), 0)` }).from(users);
    return {
      totalUsers: Number(userCount.count),
      totalRequests: Number(reqCount.count),
      openRequests: Number(openCount.count),
      acceptedRequests: Number(acceptedCount.count),
      completedRequests: Number(completedCount.count),
      totalEarnings: Number(earningsSum.total),
    };
  }
}

export const storage = new DatabaseStorage();
