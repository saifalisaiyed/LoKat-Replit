import { db } from "./db";
import { users, photoRequests } from "@shared/schema";
import { randomUUID } from "crypto";
import * as crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const DEMO_REQUESTS = [
  { locationName: "Empire State Building", address: "350 5th Ave, New York, NY", lat: 40.7484, lng: -73.9857, category: "landmarks", reward: 8, orientation: "portrait", angle: "looking-up", timing: "now" },
  { locationName: "Central Park", address: "Central Park, New York, NY", lat: 40.7829, lng: -73.9654, category: "nature", reward: 5, orientation: "landscape", angle: "eye-level", timing: "now" },
  { locationName: "Brooklyn Bridge", address: "Brooklyn Bridge, New York, NY", lat: 40.7061, lng: -73.9969, category: "landmarks", reward: 7, orientation: "landscape", angle: "eye-level", timing: "now" },
  { locationName: "Times Square", address: "Times Square, Manhattan, NY", lat: 40.758, lng: -73.9855, category: "cityscapes", reward: 6, orientation: "portrait", angle: "eye-level", timing: "now" },
  { locationName: "Chelsea Market", address: "75 9th Ave, New York, NY", lat: 40.7425, lng: -74.0061, category: "markets", reward: 5, orientation: "portrait", angle: "eye-level", timing: "now" },
  { locationName: "High Line", address: "New York, NY 10011", lat: 40.748, lng: -74.0048, category: "nature", reward: 6, orientation: "landscape", angle: "eye-level", timing: "now" },
  { locationName: "DUMBO", address: "DUMBO, Brooklyn, NY", lat: 40.7033, lng: -73.9883, category: "hidden-gems", reward: 8, orientation: "portrait", angle: "eye-level", timing: "now" },
  { locationName: "Coney Island Beach", address: "Coney Island, Brooklyn, NY", lat: 40.5749, lng: -73.9859, category: "beaches", reward: 7, orientation: "landscape", angle: "eye-level", timing: "scheduled" },
  { locationName: "Little Italy", address: "Little Italy, Manhattan, NY", lat: 40.7191, lng: -73.9973, category: "food", reward: 5, orientation: "portrait", angle: "eye-level", timing: "now" },
  { locationName: "Yankee Stadium", address: "1 E 161st St, Bronx, NY", lat: 40.8296, lng: -73.9262, category: "events", reward: 10, orientation: "landscape", angle: "eye-level", timing: "scheduled" },
  { locationName: "Rockefeller Center", address: "45 Rockefeller Plaza, New York, NY", lat: 40.7587, lng: -73.9787, category: "landmarks", reward: 6, orientation: "portrait", angle: "looking-up", timing: "now" },
  { locationName: "Washington Square Park", address: "Washington Sq, New York, NY", lat: 40.7308, lng: -73.9973, category: "nature", reward: 5, orientation: "landscape", angle: "eye-level", timing: "now" },
];

async function seed() {
  console.log("Seeding database...");

  const seekerId = randomUUID();
  const [seekerUser] = await db
    .insert(users)
    .values({
      id: seekerId,
      username: "demo_seeker",
      email: "seeker@lokat.app",
      phone: "+1234567890",
      password: hashPassword("demo1234"),
      displayName: "NYC Explorer",
      requestsCreated: DEMO_REQUESTS.length,
      isAdmin: false,
    })
    .onConflictDoNothing()
    .returning();

  if (!seekerUser) {
    console.log("Seeker user already exists, skipping seed.");
    return;
  }

  const lokaterId = randomUUID();
  await db
    .insert(users)
    .values({
      id: lokaterId,
      username: "demo_lokater",
      email: "lokater@lokat.app",
      phone: "+1987654321",
      password: hashPassword("demo1234"),
      displayName: "Street Photographer",
      requestsFulfilled: 3,
      earnings: 22.50,
      isAdmin: false,
    })
    .onConflictDoNothing();

  const adminId = randomUUID();
  await db
    .insert(users)
    .values({
      id: adminId,
      username: "admin",
      email: "admin@lokat.app",
      phone: "+1000000000",
      password: hashPassword("admin1234"),
      displayName: "Admin",
      isAdmin: true,
    })
    .onConflictDoNothing();

  const now = new Date();
  for (let i = 0; i < DEMO_REQUESTS.length; i++) {
    const r = DEMO_REQUESTS[i];
    const createdAt = new Date(now.getTime() - (i * 15 + Math.random() * 30) * 60000);
    await db.insert(photoRequests).values({
      id: randomUUID(),
      creatorId: seekerId,
      latitude: r.lat,
      longitude: r.lng,
      locationName: r.locationName,
      address: r.address,
      category: r.category,
      orientation: r.orientation,
      angle: r.angle,
      timing: r.timing,
      reward: r.reward,
      status: "open",
      createdAt,
    });
  }

  console.log("Seeded 3 users: seeker@lokat.app, lokater@lokat.app, admin@lokat.app");
  console.log(`Seeded ${DEMO_REQUESTS.length} demo requests`);
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  });
