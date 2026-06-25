import { useState } from "react";
import type { PhotoRequest } from "@/lib/types";

export interface AdminStats {
  totalUsers: number;
  totalRequests: number;
  openRequests: number;
  completedRequests: number;
  totalEarnings: number;
}

export function useAdminData() {
  const [requests, setRequests] = useState<PhotoRequest[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  return {
    requests, setRequests,
    stats, setStats,
    statusFilter, setStatusFilter,
    loading, setLoading,
    refreshing, setRefreshing,
  };
}
