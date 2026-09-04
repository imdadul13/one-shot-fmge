# ONE SHOT FMGE — Clinical Preparation & Mastery Platform

> **Your FMGE. One focused plan.** High-yield 19 medical subjects, adaptive priority engine, closed-loop error remediation, 10-MCQ practice drills, crash slides, and spaced revision retention.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20+ (or LTS)
- npm 10+

### Steps
1. **Clone and install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Add your `GEMINI_API_KEY` in `.env`.
3. **Start development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🛠️ Verification & Building

Run the complete automated validation suite before deploying:

```bash
# Typecheck + run 30 test suites (173 unit tests) + production bundle
npm run validate
```

Or run steps individually:
```bash
npm run lint         # TypeScript check (tsc --noEmit)
npm test             # Unit & Integration test suite
npm run build        # Builds client SPA, server bundle & worker bundle
npm start            # Starts the production web server
npm run start:worker # Starts the Telegram background worker
```

---

## 🌐 Deployment Options

### Option 1: Render (Recommended Full-Stack)
This repository includes a blueprint specification in `render.yaml` configuring:
- `oneshot-fmge-web`: Web API & Frontend SPA
- `oneshot-fmge-telegram-worker`: Standalone MTProto background ingestion worker
- `oneshot-fmge-db`: Managed PostgreSQL database

**Deploying to Render:**
1. Push your repository to GitHub or GitLab.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New > Blueprint**.
3. Select this repository. Render will automatically detect `render.yaml` and configure all services.
4. Fill in secret environment variables (`GEMINI_API_KEY`, and optionally `TELEGRAM_API_ID` & `TELEGRAM_API_HASH`).
5. Click **Apply**.

---

### Option 2: Docker / Container Platforms (VPS, Railway, Fly.io, Cloud Run)
A multi-stage `Dockerfile` is included.

**Build and run container locally:**
```bash
docker build -t oneshot-fmge .
docker run -p 3000:3000 -e GEMINI_API_KEY="your_key" oneshot-fmge
```

**Docker Compose / Railway / Fly.io:**
Point your service to the `Dockerfile`. The container runs `node dist/server.cjs` on `PORT 3000` with static assets and health check endpoint at `/api/health`.

---

### Option 3: Process Managers / PaaS (Heroku, Railway, Dokku)
A `Procfile` is pre-configured:
```text
web: npm run start
worker: npm run start:worker
```
Simply connect your git repository and set the environment variables in your provider's dashboard.

---

### Option 4: Vercel / Netlify (Frontend SPA)
If deploying the frontend independently on Vercel or Netlify:
- **Vercel**: Configuration is provided in `vercel.json` with SPA route rewrites.
- **Netlify**: Configuration is provided in `netlify.toml` with redirect rules.
- **Build Command**: `npm run build:client` (or `npm run build`)
- **Output Directory**: `dist`

---

## 🔑 Environment Variables Reference

| Variable | Required | Description |
| :--- | :---: | :--- |
| `NODE_ENV` | Yes | Set to `production` in live environments. |
| `PORT` | Auto | Port for Express server (defaults to 3000 or platform `$PORT`). |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key for dynamic MCQ generation and distractor analysis. |
| `DATABASE_URL` | Optional | PostgreSQL connection string. (Falls back to local file store if omitted). |
| `SESSION_ENCRYPTION_KEY` | Optional | 32-byte hex key for encrypting Telegram MTProto sessions at rest. |
| `TELEGRAM_API_ID` | Optional | Telegram application ID from [my.telegram.org](https://my.telegram.org/apps). |
| `TELEGRAM_API_HASH` | Optional | Telegram application hash from [my.telegram.org](https://my.telegram.org/apps). |
