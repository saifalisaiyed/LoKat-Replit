import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { getApiUrl } from "./query-client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (e) {
    console.warn("Could not get push token (expected in Expo Go without EAS project ID):", e);
    return null;
  }
}

async function savePushToken(token: string): Promise<void> {
  try {
    const baseUrl = getApiUrl();
    await fetch(`${baseUrl}api/auth/push-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token }),
    });
  } catch (e) {
    console.warn("Failed to save push token:", e);
  }
}

function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): void {
  const data = response.notification.request.content.data as Record<string, string> | undefined;
  if (!data) return;

  const { type, requestId } = data;
  if (!requestId) return;

  switch (type) {
    case "message":
      router.push(`/chat/${requestId}` as any);
      break;
    case "accepted":
    case "submitted":
    case "completed":
    case "new_request":
      router.push(`/request-detail/${requestId}` as any);
      break;
  }
}

export function usePushNotifications(isAuthenticated: boolean): void {
  const responseListenerRef = useRef<Notifications.EventSubscription | null>(null);
  const foregroundListenerRef = useRef<Notifications.EventSubscription | null>(null);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || registeredRef.current || Platform.OS === "web") return;

    registeredRef.current = true;

    registerForPushNotificationsAsync().then((token) => {
      if (token) savePushToken(token);
    });

    foregroundListenerRef.current = Notifications.addNotificationReceivedListener(
      (_notification) => {
      },
    );

    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    return () => {
      if (foregroundListenerRef.current) {
        Notifications.removeNotificationSubscription(foregroundListenerRef.current);
      }
      if (responseListenerRef.current) {
        Notifications.removeNotificationSubscription(responseListenerRef.current);
      }
      registeredRef.current = false;
    };
  }, [isAuthenticated]);
}
