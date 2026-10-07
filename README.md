# Preppal Admin

Operations-facing Next.js application for Preppal. Its feature-oriented foundation includes Tailwind CSS, TanStack Query, Zustand, and class-based light/dark/system theming.

## Run locally

```bash
cp .env.example .env.local
bun install
bun dev --port 3001
```

The admin app runs at `http://localhost:3001` and expects the API at `http://localhost:4000`.

## Secure administrator sign-in

The console uses the shared Preppal account system, but the backend only grants
access to users whose database role is `ADMIN`. It does not rely on a
frontend-only redirect.

Before signing in:

1. Register and verify the user account normally.
2. Promote it in a trusted PostgreSQL console:

   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
   ```

3. Set `NEXT_PUBLIC_API_URL` to the deployed backend URL.
4. Add this console's origin (for example `https://admin.example.com`) to the
   backend `CORS_ORIGINS` value. The backend must allow credentials for the
   HTTP-only session cookie to be sent.

All routes inside the console verify `/api/v1/auth/admin/me` before rendering.
The **Sign out** action revokes the active backend session.

## Source layout

```text
src/
├── app/          # Admin routes, layouts, and theme tokens
├── components/   # Shared UI and admin shell components
├── config/       # Runtime configuration
├── constants/    # API, navigation, and theme constants
├── features/     # Vertical admin features
├── lib/          # API client, query client, utilities
├── providers/    # React application providers
├── store/        # Shared Zustand state
└── types/        # Shared TypeScript contracts
```

## Quality checks

```bash
bun run lint
bun run typecheck
bun run build
```
