import { env } from "@/config/env";

export const AI_LIMIT_EVENT = "preppal:ai-limit-reached";

function isAiRequest(path: string): boolean {
  return (
    path.includes("/ai/") ||
    path.includes("/ai-") ||
    path.endsWith("/ai")
  );
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiClient<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    let message = `API request failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (typeof body.message === "string") message = body.message;
      if (Array.isArray(body.message)) message = body.message.join(" ");
    } catch {
      // Keep the status-based message if the server did not return JSON.
    }
    if (response.status === 429 && isAiRequest(path)) {
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(AI_LIMIT_EVENT, { detail: { message } }),
        );
      });
    }
    throw new ApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}
