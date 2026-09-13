# Preppal Admin

Operations-facing Next.js application for Preppal. Its feature-oriented foundation includes Tailwind CSS, TanStack Query, Zustand, and class-based light/dark/system theming.

## Run locally

```bash
cp .env.example .env.local
bun install
bun dev --port 3001
```

The admin app runs at `http://localhost:3001` and expects the API at `http://localhost:4000`.

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
