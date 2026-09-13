export interface ApiEnvelope<T> {
  data: T;
  timestamp: string;
}
export interface SystemStatus {
  service: string;
  status: "ok" | "degraded";
  version: string;
  database: "connected" | "disconnected";
}
