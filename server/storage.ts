import { eq, desc, and, or, ne, sql, asc, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  photoRequests,
  notifications,
  messages,
  type User,
  type InsertUser,
  type PhotoRequest,
  type InsertPhotoRequest,
  type Notification,
  type Message,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { sendPushToUser, sendPushToUsers } from "./pushNotifications";
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
  setHasPaymentMethod(userId: string): Promise<void>;
  updatePayoutInfo(userId: string, info: string): Promise<void>;

  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(userId: string, title: string, body: string, type: string, requestId?: string): Promise<Notification>;
  markNotificationRead(id: string, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;



  getMessages(requestId: string): Promise<Message[]>;
  createMessage(requestId: string, senderId: string, text: string): Promise<Message>;

  getAllRequestsAdmin(statusFilter?: string): Promise<PhotoRequest[]>;
  deleteAllRequests(): Promise<number>;
  getAllUsersAdmin(): Promise<User[]>;
  getAdminStats(): Promise<{ totalUsers: number; totalRequests: number; openRequests: number; acceptedRequests: number; completedRequests: number; totalEarnings: number }>;
  updateUserPushToken(userId: string, token: string): Promise<void>;
  getAllUserIdsExcept(excludeUserId: string): Promise<string[]>;
  setResetToken(userId: string, token: string, expiry: Date): Promise<void>;
  resetUserPassword(userId: string, hashedPassword: string): Promise<void>;
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
    return db
      .select()
      .from(photoRequests)
      .where(eq(photoRequests.status, "open"))
      .orderBy(desc(photoRequests.createdAt));
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
      const lokater = await this.getUser(userId);
      const lokaterName = lokater?.displayName || "A LoKater";
      await this.createNotification(
        req.creatorId,
        "Someone's on their way!",
        `${lokaterName} accepted your request for ${req.locationName}`,
        "accepted",
        id,
      );
      await sendPushToUser(
        req.creatorId,
        "Someone's on their way! 📍",
        `${lokaterName} accepted your request for ${req.locationName}`,
        { requestId: id, type: "accepted" },
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
        "Photo ready!",
        `Your photo of ${req.locationName} has been taken`,
        "submitted",
        id,
      );
      await sendPushToUser(
        req.creatorId,
        "Your photo is ready! 📸",
        `Your photo of ${req.locationName} has been taken. Processing payment…`,
        { requestId: id, type: "submitted" },
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
        "Photo delivered!",
        `Your photo of ${req.locationName} has been delivered!`,
        "completed",
        id,
      );
      await sendPushToUser(
        req.acceptedBy,
        "💰 Payment received!",
        `$${req.reward.toFixed(2)} added to your balance for ${req.locationName}`,
        { requestId: id, type: "completed" },
      );
      await sendPushToUser(
        req.creatorId,
        "📷 Photo delivered!",
        `Your photo of ${req.locationName} is ready to view`,
        { requestId: id, type: "completed" },
      );
    }
    return req;
  }

  async updateUserPushToken(userId: string, token: string): Promise<void> {
    await db.update(users).set({ expoPushToken: token }).where(eq(users.id, userId));
  }

  async setResetToken(userId: string, token: string, expiry: Date): Promise<void> {
    await db.update(users).set({ resetToken: token, resetTokenExpiry: expiry }).where(eq(users.id, userId));
  }

  async resetUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword, resetToken: null, resetTokenExpiry: null }).where(eq(users.id, userId));
  }

  async getAllUserIdsExcept(excludeUserId: string): Promise<string[]> {
    const rows = await db.select({ id: users.id }).from(users).where(ne(users.id, excludeUserId));
    return rows.map((r) => r.id);
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

  async setHasPaymentMethod(userId: string): Promise<void> {
    await db.update(users).set({ hasPaymentMethod: true }).where(eq(users.id, userId));
  }

  async updatePayoutInfo(userId: string, info: string): Promise<void> {
    await db.update(users).set({ payoutInfo: info }).where(eq(users.id, userId));
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
