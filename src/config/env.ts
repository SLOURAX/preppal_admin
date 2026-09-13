interface PublicEnvironment {
  readonly apiUrl: string;
}

export const env: PublicEnvironment = {
  apiUrl: (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(
    /\/$/,
    "",
  ),
} as const;
