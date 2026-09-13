import { API } from "@/constants";
import { apiClient } from "@/lib/api";
import type { ApiEnvelope, SystemStatus } from "@/types";

export const getSystemStatus = (): Promise<ApiEnvelope<SystemStatus>> =>
  apiClient<ApiEnvelope<SystemStatus>>(API.endpoints.health);
