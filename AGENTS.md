# AGENTS.md — ONE SHOT FMGE

## Quick Commands

```bash
npm run dev          # Express + Vite dev server on :3000
npm run lint         # TypeScript type-check (tsc --noEmit) — no ESLint
npm test             # 31 test suites via Node built-in runner: tsx --test src/utils/__tests__/*.test.ts
npm run build        # Vite client + esbuild server + esbuild worker → dist/
npm run validate     # lint → test → build (run before any deploy)
npm start            # Production server: node dist/server.cjs
npm run start:worker # Telegram MTProto worker: node dist/worker.cjs
```

## Architecture

| Process | Entry | Bundle |
|---------|-------|--------|
| Web server | `server.ts` | `dist/server.cjs` (esbuild, CJS) |
| Telegram worker | `worker.ts` | `dist/worker.cjs` (esbuild, CJS) |
| Frontend SPA | `src/main.tsx` → `src/App.tsx` | `dist/` (Vite) |

- Express serves the Vite SPA in dev, static `dist/` in prod.
- Worker runs as a standalone process (see `render.yaml` or `Procfile`).
- API routes live in `server/fmge-routes.ts`.
- `@/` alias resolves to `src/`.

## Data & Storage

- No `DATABASE_URL` → falls back to JSON files in `server/data/` and `data/`.
- `server/db/schema.sql` has the PostgreSQL schema for when a database is provided.
- `data/*.json` and `server/data/*.json` are runtime data files — **do not commit secrets or large generated assets**.

## Environment

Copy `.env.example` → `.env`. Key vars:
- `GEMINI_API_KEY` — required for AI features
- `DATABASE_URL` — optional (PostgreSQL)
- `TELEGRAM_API_ID` / `TELEGRAM_API_HASH` — optional (MTProto)
- `SESSION_ENCRYPTION_KEY` — optional (AES-256-GCM for session encryption)

## Testing

- Tests live in `src/utils/__tests__/*.test.ts` (client-side logic) and `server/__tests__/` (server logic).
- Run a single test: `tsx --test src/utils/__tests__/specific.test.ts`
- Test runner is Node's built-in `node:test` via `tsx`. No Jest/Vitest.

## Monorepo Note

`fmge-study-tracker/` is a **separate** Google AI Studio app. It has its own `package.json`, `vite.config.ts`, and Firebase config. It is **not** part of the main build or deploy pipeline. Ignore it unless explicitly asked to work on it.

## Gotchas

- `npm run build` runs three sequential builds (client → server → worker). If client build fails, server/worker bundles are not produced.
- The `dist/` directory is gitignored — always build before deploying.
- Vite HMR is disabled when `DISABLE_HMR=true` (AI Studio environments).
- Server watches ignore `server/data/**`, `server/db/**`, and `data/*.json` to avoid infinite reload loops.
- `tsconfig.json` excludes `FMGE-Study-Tracker-main` — type-checking won't catch issues there.
