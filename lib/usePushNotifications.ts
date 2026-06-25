import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import { getApiUrl } from "./query-client";
import Constants from "expo-constants";

const isExpoGo = Constants.appOwnership === "expo";

if (!isExpoGo && Platform.OS !== "web") {
  try {
    const Notifications = require("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (_e) {
  }
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web" || isExpoGo) return null;
  try {
    const Notifications = require("expo-notifications");
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (error) {
    console.warn("Push notification setup skipped:", error);
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
  } catch (error) {
    console.warn("Failed to save push token:", error);
  }
}

export function usePushNotifications(isAuthenticated: boolean): void {
  const responseListenerRef = useRef<any>(null);
  const foregroundListenerRef = useRef<any>(null);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || registeredRef.current || Platform.OS === "web" || isExpoGo) return;

    registeredRef.current = true;

    registerForPushNotificationsAsync().then((token) => {
      if (token) savePushToken(token);
    });

    try {
      const Notifications = require("expo-notifications");

      foregroundListenerRef.current = Notifications.addNotificationReceivedListener(() => {});

      responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
        (response: any) => {
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
        },
      );
    } catch (_e) {
    }

    return () => {
      try {
        const Notifications = require("expo-notifications");
        if (foregroundListenerRef.current) {
          Notifications.removeNotificationSubscription(foregroundListenerRef.current);
        }
        if (responseListenerRef.current) {
          Notifications.removeNotificationSubscription(responseListenerRef.current);
        }
      } catch (_e) {
      }
      registeredRef.current = false;
    };
  }, [isAuthenticated]);
}
