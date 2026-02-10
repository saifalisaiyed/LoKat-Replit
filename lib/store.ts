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
  Role,
  PhotoRequest,
  UserProfile,
  Orientation,
  Angle,
  Timing,
  RequestStatus,
} from "./types";
import { demoRequests } from "./demo-data";

const REQUESTS_KEY = "@lokate_requests";
const SEEDED_KEY = "@lokate_seeded";
const PROFILE_KEY = "@lokate_profile";

const defaultProfile: UserProfile = {
  role: "seeker",
  name: "User",
  earnings: 0,
  requestsCreated: 0,
  requestsFulfilled: 0,
};

interface AppContextValue {
  profile: UserProfile;
  requests: PhotoRequest[];
  isLoading: boolean;
  setRole: (role: Role) => void;
  createRequest: (req: Omit<PhotoRequest, "id" | "seekerId" | "status" | "createdAt">) => void;
  claimRequest: (id: string) => void;
  submitPhoto: (id: string, photoUri: string) => void;
  acceptPhoto: (id: string) => void;
  deleteRequest: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [requests, setRequests] = useState<PhotoRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedProfile, savedRequests] = await Promise.all([
        AsyncStorage.getItem(PROFILE_KEY),
        AsyncStorage.getItem(REQUESTS_KEY),
      ]);
      if (savedProfile) setProfile(JSON.parse(savedProfile));
      if (savedRequests) {
        setRequests(JSON.parse(savedRequests));
      } else {
        const alreadySeeded = await AsyncStorage.getItem(SEEDED_KEY);
        if (!alreadySeeded) {
          setRequests(demoRequests);
          await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(demoRequests));
          await AsyncStorage.setItem(SEEDED_KEY, "true");
        }
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

  const setRole = useCallback(
    (role: Role) => {
      saveProfile({ ...profile, role });
    },
    [profile],
  );

  const createRequest = useCallback(
    (req: Omit<PhotoRequest, "id" | "seekerId" | "status" | "createdAt">) => {
      const newReq: PhotoRequest = {
        ...req,
        id: Crypto.randomUUID(),
        seekerId: "me",
        status: "open",
        createdAt: new Date().toISOString(),
      };
      const updated = [newReq, ...requests];
      saveRequests(updated);
      saveProfile({ ...profile, requestsCreated: profile.requestsCreated + 1 });
    },
    [requests, profile],
  );

  const claimRequest = useCallback(
    (id: string) => {
      const updated = requests.map((r) =>
        r.id === id ? { ...r, status: "claimed" as RequestStatus, claimedBy: "me" } : r,
      );
      saveRequests(updated);
    },
    [requests],
  );

  const submitPhoto = useCallback(
    (id: string, photoUri: string) => {
      const updated = requests.map((r) =>
        r.id === id
          ? { ...r, status: "submitted" as RequestStatus, photoUri, submittedAt: new Date().toISOString() }
          : r,
      );
      saveRequests(updated);
    },
    [requests],
  );

  const acceptPhoto = useCallback(
    (id: string) => {
      const req = requests.find((r) => r.id === id);
      const updated = requests.map((r) =>
        r.id === id ? { ...r, status: "completed" as RequestStatus } : r,
      );
      saveRequests(updated);
      if (req) {
        saveProfile({
          ...profile,
          earnings: profile.earnings + req.reward,
          requestsFulfilled: profile.requestsFulfilled + 1,
        });
      }
    },
    [requests, profile],
  );

  const deleteRequest = useCallback(
    (id: string) => {
      const updated = requests.filter((r) => r.id !== id);
      saveRequests(updated);
    },
    [requests],
  );

  const value = useMemo(
    () => ({
      profile,
      requests,
      isLoading,
      setRole,
      createRequest,
      claimRequest,
      submitPhoto,
      acceptPhoto,
      deleteRequest,
    }),
    [profile, requests, isLoading, setRole, createRequest, claimRequest, submitPhoto, acceptPhoto, deleteRequest],
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
