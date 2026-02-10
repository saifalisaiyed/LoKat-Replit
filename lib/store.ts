import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import React from "react";
import type {
  PhotoRequest,
  UserProfile,
  RequestStatus,
  Notification,
  Category,
} from "./types";
import { demoRequests, demoNotifications } from "./demo-data";

const REQUESTS_KEY = "@lokate_requests";
const PROFILE_KEY = "@lokate_profile";
const NOTIFS_KEY = "@lokate_notifications";
const SEEDED_KEY = "@lokate_seeded_v2";

const defaultProfile: UserProfile = {
  name: "Alex",
  earnings: 24.0,
  requestsCreated: 3,
  requestsFulfilled: 5,
};

interface AppContextValue {
  profile: UserProfile;
  requests: PhotoRequest[];
  notifications: Notification[];
  isLoading: boolean;
  createRequest: (
    req: Omit<PhotoRequest, "id" | "creatorId" | "status" | "createdAt">,
  ) => void;
  acceptRequest: (id: string) => void;
  submitPhoto: (id: string, photoUri: string) => void;
  completeRequest: (id: string) => void;
  deleteRequest: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadCount: number;
  getRequestsByCategory: (category: Category | null) => PhotoRequest[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [requests, setRequests] = useState<PhotoRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedProfile, savedRequests, savedNotifs, seeded] =
        await Promise.all([
          AsyncStorage.getItem(PROFILE_KEY),
          AsyncStorage.getItem(REQUESTS_KEY),
          AsyncStorage.getItem(NOTIFS_KEY),
          AsyncStorage.getItem(SEEDED_KEY),
        ]);

      if (savedProfile) setProfile(JSON.parse(savedProfile));
      if (savedRequests) {
        setRequests(JSON.parse(savedRequests));
      } else if (!seeded) {
        setRequests(demoRequests);
        await AsyncStorage.setItem(
          REQUESTS_KEY,
          JSON.stringify(demoRequests),
        );
      }
      if (savedNotifs) {
        setNotifications(JSON.parse(savedNotifs));
      } else if (!seeded) {
        setNotifications(demoNotifications);
        await AsyncStorage.setItem(
          NOTIFS_KEY,
          JSON.stringify(demoNotifications),
        );
      }
      if (!seeded) {
        await AsyncStorage.setItem(SEEDED_KEY, "true");
      }
    } catch (e) {
      console.error("Failed to load data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (p: UserProfile) => {
    setProfile(p);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  };

  const saveRequests = async (r: PhotoRequest[]) => {
    setRequests(r);
    await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(r));
  };

  const saveNotifications = async (n: Notification[]) => {
    setNotifications(n);
    await AsyncStorage.setItem(NOTIFS_KEY, JSON.stringify(n));
  };

  const addNotification = (
    title: string,
    body: string,
    type: Notification["type"],
    requestId?: string,
  ) => {
    const notif: Notification = {
      id: Crypto.randomUUID(),
      title,
      body,
      type,
      requestId,
      createdAt: new Date().toISOString(),
      read: false,
    };
    const updated = [notif, ...notifications];
    saveNotifications(updated);
  };

  const createRequest = useCallback(
    (
      req: Omit<PhotoRequest, "id" | "creatorId" | "status" | "createdAt">,
    ) => {
      const newReq: PhotoRequest = {
        ...req,
        id: Crypto.randomUUID(),
        creatorId: "me",
        status: "open",
        createdAt: new Date().toISOString(),
      };
      const updated = [newReq, ...requests];
      saveRequests(updated);
      saveProfile({
        ...profile,
        requestsCreated: profile.requestsCreated + 1,
      });
    },
    [requests, profile],
  );

  const acceptRequest = useCallback(
    (id: string) => {
      const updated = requests.map((r) =>
        r.id === id
          ? { ...r, status: "accepted" as RequestStatus, acceptedBy: "me" }
          : r,
      );
      saveRequests(updated);
      const req = requests.find((r) => r.id === id);
      if (req) {
        addNotification(
          "Request accepted",
          `You accepted the request for ${req.locationName}`,
          "accepted",
          id,
        );
      }
    },
    [requests, notifications],
  );

  const submitPhoto = useCallback(
    (id: string, photoUri: string) => {
      const updated = requests.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "submitted" as RequestStatus,
              photoUri,
              submittedAt: new Date().toISOString(),
            }
          : r,
      );
      saveRequests(updated);
      const req = requests.find((r) => r.id === id);
      if (req) {
        addNotification(
          "Photo submitted",
          `Photo for ${req.locationName} has been submitted`,
          "submitted",
          id,
        );
      }
    },
    [requests, notifications],
  );

  const completeRequest = useCallback(
    (id: string) => {
      const req = requests.find((r) => r.id === id);
      const updated = requests.map((r) =>
        r.id === id
          ? { ...r, status: "completed" as RequestStatus }
          : r,
      );
      saveRequests(updated);
      if (req) {
        saveProfile({
          ...profile,
          earnings: profile.earnings + req.reward,
          requestsFulfilled: profile.requestsFulfilled + 1,
        });
        addNotification(
          "Payment received",
          `You earned $${req.reward.toFixed(2)} for ${req.locationName}`,
          "completed",
          id,
        );
      }
    },
    [requests, profile, notifications],
  );

  const deleteRequest = useCallback(
    (id: string) => {
      const updated = requests.filter((r) => r.id !== id);
      saveRequests(updated);
    },
    [requests],
  );

  const markNotificationRead = useCallback(
    (id: string) => {
      const updated = notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
      saveNotifications(updated);
    },
    [notifications],
  );

  const markAllNotificationsRead = useCallback(() => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const getRequestsByCategory = useCallback(
    (category: Category | null) => {
      const open = requests.filter((r) => r.status === "open" && r.creatorId !== "me");
      if (!category) return open;
      return open.filter((r) => r.category === category);
    },
    [requests],
  );

  const value = useMemo(
    () => ({
      profile,
      requests,
      notifications,
      isLoading,
      createRequest,
      acceptRequest,
      submitPhoto,
      completeRequest,
      deleteRequest,
      markNotificationRead,
      markAllNotificationsRead,
      unreadCount,
      getRequestsByCategory,
    }),
    [
      profile,
      requests,
      notifications,
      isLoading,
      createRequest,
      acceptRequest,
      submitPhoto,
      completeRequest,
      deleteRequest,
      markNotificationRead,
      markAllNotificationsRead,
      unreadCount,
      getRequestsByCategory,
    ],
  );

  return React.createElement(AppContext.Provider, { value }, children);
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
