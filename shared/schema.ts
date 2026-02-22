import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  doublePrecision,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull().default("LoKater"),
  earnings: doublePrecision("earnings").notNull().default(0),
  requestsCreated: integer("requests_created").notNull().default(0),
  requestsFulfilled: integer("requests_fulfilled").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const photoRequests = pgTable("photo_requests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id")
    .notNull()
    .references(() => users.id),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  locationName: text("location_name").notNull(),
  address: text("address").notNull().default(""),
  category: text("category").notNull().default("landmarks"),
  orientation: text("orientation").notNull().default("portrait"),
  angle: text("angle").notNull().default("eye-level"),
  timing: text("timing").notNull().default("now"),
  scheduledTime: text("scheduled_time"),
  reward: doublePrecision("reward").notNull().default(5),
  status: text("status").notNull().default("open"),
  acceptedBy: varchar("accepted_by").references(() => users.id),
  photoUri: text("photo_uri"),
  submittedAt: text("submitted_at"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull().default("new_request"),
  requestId: varchar("request_id"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
});

export const insertPhotoRequestSchema = createInsertSchema(photoRequests).omit({
  id: true,
  creatorId: true,
  status: true,
  acceptedBy: true,
  photoUri: true,
  submittedAt: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type PhotoRequest = typeof photoRequests.$inferSelect;
export type InsertPhotoRequest = z.infer<typeof insertPhotoRequestSchema>;
export type Notification = typeof notifications.$inferSelect;
