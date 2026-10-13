"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type { AdminAnalytics, AnalyticsPeriod } from "./types";

export function useAdminAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ["admin", "analytics", period],
    queryFn: () =>
      apiClient<AdminAnalytics>(
        `/api/v1/admin/analytics?period=${encodeURIComponent(period)}`,
      ),
    staleTime: 60_000,
  });
}
