import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from "react";
import React from "react";
import { apiRequest, getApiUrl } from "./query-client";
import { fetch } from "expo/fetch";
import type {
  PhotoRequest,
  UserProfile,
  RequestStatus,
  Notification,
  Category,
} from "./types";

interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  phone: string;
  earnings: number;
  requestsCreated: number;
  requestsFulfilled: number;
}

interface AppContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  profile: UserProfile;
  requests: PhotoRequest[];
  notifications: Notification[];
  isLoading: boolean;
  activeRequestId: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (phone: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (data: { displayName?: string; email?: string; phone?: string }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  createRequest: (req: Omit<PhotoRequest, "id" | "creatorId" | "status" | "createdAt">) => void;
  acceptRequest: (id: string) => void;
  abandonRequest: (id: string) => void;
  submitPhoto: (id: string, photoUri: string) => void;
  completeRequest: (id: string) => void;
  deleteRequest: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadCount: number;
  getRequestsByCategory: (category: Category | null) => PhotoRequest[];
  refreshRequests: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function normalizeRequest(r: any): PhotoRequest {
  return {
    ...r,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date(r.createdAt).toISOString(),
  };
}

function normalizeNotification(n: any): Notification {
  return {
    ...n,
    createdAt: typeof n.createdAt === "string" ? n.createdAt : new Date(n.createdAt).toISOString(),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [requests, setRequests] = useState<PhotoRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const profile: UserProfile = useMemo(() => {
    if (!user) return { name: "Guest", email: "", phone: "", earnings: 0, requestsCreated: 0, requestsFulfilled: 0 };
    return {
      name: user.displayName || user.username,
      email: user.email || "",
      phone: user.phone || "",
      earnings: user.earnings || 0,
      requestsCreated: user.requestsCreated || 0,
      requestsFulfilled: user.requestsFulfilled || 0,
    };
  }, [user]);

  const fetchMe = async (): Promise<AuthUser | null> => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}api/auth/me`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
    } catch (e) {}
    return null;
  };

  const fetchRequests = async () => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}api/requests`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.map(normalizeRequest));
      }
    } catch (e) {
      console.error("Failed to fetch requests:", e);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}api/notifications`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.map(normalizeNotification));
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  };

  const refreshProfile = async () => {
    const me = await fetchMe();
    if (me) setUser(me);
  };

  useEffect(() => {
    (async () => {
      try {
        const me = await fetchMe();
        if (me) {
          setUser(me);
        }
        await fetchRequests();
      } catch (e) {
        console.error("Init error:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const found = requests.find(
        (r) => r.status === "accepted" && r.acceptedBy === user.id
      );
      setActiveRequestId(found?.id || null);
    }
  }, [user, requests]);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await res.json();
      setUser(data.user);
      await fetchRequests();
      return { ok: true };
    } catch (e: any) {
      const msg = e.message || "Login failed";
      const errorText = msg.includes(":") ? msg.split(": ").slice(1).join(": ") : msg;
      try {
        const parsed = JSON.parse(errorText);
        return { ok: false, error: parsed.message || "Login failed" };
      } catch {
        return { ok: false, error: errorText };
      }
    }
  };

  const register = async (phone: string, password: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/register", { phone, password });
      const data = await res.json();
      setUser(data.user);
      await fetchRequests();
      return { ok: true };
    } catch (e: any) {
      const msg = e.message || "Registration failed";
      const errorText = msg.includes(":") ? msg.split(": ").slice(1).join(": ") : msg;
      try {
        const parsed = JSON.parse(errorText);
        return { ok: false, error: parsed.message || "Registration failed" };
      } catch {
        return { ok: false, error: errorText };
      }
    }
  };

  const updateProfile = async (data: { displayName?: string; email?: string; phone?: string }) => {
    try {
      const res = await apiRequest("PATCH", "/api/auth/profile", data);
      const result = await res.json();
      setUser(result.user);
      return { ok: true };
    } catch (e: any) {
      const msg = e.message || "Update failed";
      const errorText = msg.includes(":") ? msg.split(": ").slice(1).join(": ") : msg;
      try {
        const parsed = JSON.parse(errorText);
        return { ok: false, error: parsed.message || "Update failed" };
      } catch {
        return { ok: false, error: errorText };
      }
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (e) {}
    setUser(null);
    setRequests([]);
    setNotifications([]);
    setActiveRequestId(null);
  };

  const createRequest = useCallback(
    async (req: Omit<PhotoRequest, "id" | "creatorId" | "status" | "createdAt">) => {
      try {
        await apiRequest("POST", "/api/requests", req);
        await fetchRequests();
        await refreshProfile();
      } catch (e) {
        console.error("Create request error:", e);
      }
    },
    [],
  );

  const acceptRequest = useCallback(
    async (id: string) => {
      try {
        await apiRequest("PATCH", `/api/requests/${id}/accept`);
        await fetchRequests();
        await fetchNotifications();
      } catch (e) {
        console.error("Accept request error:", e);
      }
    },
    [],
  );

  const abandonRequest = useCallback(
    async (id: string) => {
      try {
        await apiRequest("PATCH", `/api/requests/${id}/abandon`);
        await fetchRequests();
        await fetchNotifications();
      } catch (e) {
        console.error("Abandon request error:", e);
      }
    },
    [],
  );

  const submitPhoto = useCallback(
    async (id: string, photoUri: string) => {
      try {
        await apiRequest("PATCH", `/api/requests/${id}/submit`, { photoUri });
        await fetchRequests();
        await fetchNotifications();
      } catch (e) {
        console.error("Submit photo error:", e);
      }
    },
    [],
  );

  const completeRequest = useCallback(
    async (id: string) => {
      try {
        await apiRequest("PATCH", `/api/requests/${id}/complete`);
        await fetchRequests();
        await refreshProfile();
        await fetchNotifications();
      } catch (e) {
        console.error("Complete request error:", e);
      }
    },
    [],
  );

  const deleteRequest = useCallback(
    async (id: string) => {
      try {
        await apiRequest("DELETE", `/api/requests/${id}`);
        await fetchRequests();
      } catch (e) {
        console.error("Delete request error:", e);
      }
    },
    [],
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      try {
        await apiRequest("PATCH", `/api/notifications/${id}/read`);
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      } catch (e) {
        console.error("Mark read error:", e);
      }
    },
    [],
  );

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await apiRequest("PATCH", "/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error("Mark all read error:", e);
    }
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const getRequestsByCategory = useCallback(
    (category: Category | null) => {
      const userId = user?.id;
      const open = requests.filter((r) => r.status === "open" && r.creatorId !== userId);
      if (!category) return open;
      return open.filter((r) => r.category === category);
    },
    [requests, user],
  );

  const refreshRequests = fetchRequests;

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      profile,
      requests,
      notifications,
      isLoading,
      activeRequestId,
      login,
      register,
      updateProfile,
      logout,
      createRequest,
      acceptRequest,
      abandonRequest,
      submitPhoto,
      completeRequest,
      deleteRequest,
      markNotificationRead,
      markAllNotificationsRead,
      unreadCount,
      getRequestsByCategory,
      refreshRequests,
      refreshProfile,
    }),
    [
      user,
      isAuthenticated,
      profile,
      requests,
      notifications,
      isLoading,
      activeRequestId,
      createRequest,
      acceptRequest,
      abandonRequest,
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
