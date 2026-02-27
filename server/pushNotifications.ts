import { db } from "./db";
import { users } from "../shared/schema";
import { inArray } from "drizzle-orm";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default" | null;
  badge?: number;
  priority?: "default" | "normal" | "high";
}

interface PushTicket {
  id?: string;
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

async function sendExpoPushMessages(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  const chunks: PushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        console.error("Expo push error:", response.status, await response.text());
        return;
      }

      const result = await response.json();
      const tickets: PushTicket[] = Array.isArray(result.data) ? result.data : [];
      for (const ticket of tickets) {
        if (ticket.status === "error") {
          console.error("Push ticket error:", ticket.message, ticket.details);
        }
      }
    } catch (err) {
      console.error("Failed to send push notifications:", err);
    }
  }
}

function isValidExpoPushToken(token: string): boolean {
  return token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[");
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  const [user] = await db
    .select({ expoPushToken: users.expoPushToken })
    .from(users)
    .where(inArray(users.id, [userId]));

  if (!user?.expoPushToken || !isValidExpoPushToken(user.expoPushToken)) return;

  await sendExpoPushMessages([
    {
      to: user.expoPushToken,
      title,
      body,
      sound: "default",
      priority: "high",
      data: data || {},
    },
  ]);
}

export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  if (userIds.length === 0) return;

  const rows = await db
    .select({ expoPushToken: users.expoPushToken })
    .from(users)
    .where(inArray(users.id, userIds));

  const validTokens = rows
    .map((r) => r.expoPushToken)
    .filter((t): t is string => !!t && isValidExpoPushToken(t));

  if (validTokens.length === 0) return;

  await sendExpoPushMessages(
    validTokens.map((token) => ({
      to: token,
      title,
      body,
      sound: "default",
      priority: "high",
      data: data || {},
    })),
  );
}
