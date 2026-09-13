"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import type { ApiEnvelope, SystemStatus } from "@/types";
import { getSystemStatus } from "../api/get-system-status";

export const useSystemStatus = (): UseQueryResult<
  ApiEnvelope<SystemStatus>,
  Error
> =>
  useQuery<ApiEnvelope<SystemStatus>, Error>({
    queryKey: ["system", "health"],
    queryFn: getSystemStatus,
  });
