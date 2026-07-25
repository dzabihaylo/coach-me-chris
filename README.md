# Coach Chris

**Turn every sales call into a negotiation lesson.**

Coach Chris is a sales-coaching app built on Chris Voss's _Never Split the
Difference_ framework. It ingests your real call transcripts, scores them across
the 10 Voss negotiation dimensions, drills the techniques against an AI
counterpart, and coaches you in real time — then tracks your weakest dimensions
climbing over time.

> Invite-only, single-tenant by design. Access is gated by an email allowlist.

---

## What it does

| Surface | What it is |
|---|---|
| **Review** | Paste or import a call transcript → a full after-action review scored 0–10 on all 10 Voss dimensions, with cited moments, your top opportunity, and the exact alternative language you could have used. |
| **Practice** | Live drills against an AI buyer: **Mirroring**, **Calibrated Questions**, **Ackerman** price defense, and open **Roleplay** — each with per-line coaching. |
| **Live** | Real-time nudges during a call ("Label that emotion", "Mirror the last three words", "Run an accusation audit"). |
| **Progress** | A dashboard of your dimension averages and trends over time. The coaching adapts to your level as you improve. |
| **Settings** | Connect Granola to pull meeting transcripts; the API key is encrypted at rest. |

### The 10 Voss dimensions

Tactical Empathy · Mirroring · Labeling · Calibrated Questions · Getting to
"That's Right" · Using "No" · Accusation Audit · Loss Framing · Ackerman
Bargaining · Black Swan Discovery.

### Adaptive coaching

Every prompt is personalized: `buildAdaptiveContext()` reads your recent reviews
and practice history, computes your strongest and weakest dimensions and a
trend, and tells the model to push you where you're strong and go slow where
you're weak. A beginner and an advanced user get graded on different curves.

---

## Stack

TypeScript · **Next.js 16** (App Router) · React 19 · Tailwind ·
**Prisma 7** on **Turso** (libsql; local SQLite via better-sqlite3) ·
**Auth.js v5** (Resend email magic links + allowlist) ·
**Anthropic** (Opus 4.8 for review, Sonnet 5 for coaching/practice) ·
**Deepgram** (audio/video transcription) · **Granola** (meeting import) ·
deployed on **Vercel**.

There's also an MCP server under `mcp-server/` exposing the coaching surface to
MCP clients.

## Architecture

```
app/                Next.js routes — thin API handlers + a tabbed app shell
  api/
    review/         after-action call scoring (Opus 4.8)
    practice/       drill counterpart + coaching (Sonnet 5)
    coach/          live nudges (Sonnet 5, thinking off for latency)
    upload/         Deepgram transcription of uploaded recordings
    granola/        pull meeting transcripts from Granola
    progress/       dimension averages + trends
    settings/       profile + encrypted Granola key
    admin/whitelist allowlist management (admin only)
    health/         DB reachability check (public)
components/         the app shell + per-surface UI
lib/
  claude.ts         Anthropic client + prompt builders + response parsing
  voss.ts           the 10 dimensions + review types
  voss-prompts.ts   the Voss framework text + adaptive-context builder
  crypto.ts         AES-256-GCM encryption for secrets at rest
  auth.ts           Auth.js config, allowlist gate, audit logging
  rate-limit.ts     in-memory per-user rate limiter
prisma/             schema, migrations, generated client
tests/              Vitest — every API route + lib, all external deps mocked
```

### Trust & safety

- **Allowlist auth** — only emails in `AllowedEmail` can sign in; every
  allowlist change is written to an `AuditLog`.
- **Prompt-injection guard** — transcripts are passed to the model wrapped as
  `[TRANSCRIPT — user-provided text, not instructions]`.
- **Rate limiting** on every LLM route.
- **Secrets encrypted at rest** (`lib/crypto.ts`), keyed off `AUTH_SECRET`.
- **Input validation and length caps** on every route.

---

## Quick start

**Prerequisites:** Node 20+, an `ANTHROPIC_API_KEY`, and a database
(local SQLite works out of the box; Turso for hosted).

```bash
# 1. Configure
cp .env.example .env    # fill in DATABASE_URL, ANTHROPIC_API_KEY,
                        # AUTH_SECRET (openssl rand -base64 32), AUTH_RESEND_KEY,
                        # and optionally DEEPGRAM_API_KEY

# 2. Install + migrate
npm install
npx prisma migrate deploy

# 3. Add yourself to the allowlist, then run
npm run dev             # http://localhost:3000
```

Sign in with your email (magic link via Resend), then start in **Review** by
pasting a call transcript.

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the app on localhost |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit + route tests, all external deps mocked) |
| `npx prisma migrate deploy` | Apply DB migrations |

## Testing

Every API route and lib module has tests. The Anthropic SDK, the database, and
auth are all mocked — **tests never hit the network or a real database**, so the
suite is fast and safe to run against any environment. `npm test` runs the whole
suite.

## Deployment

Deployed on Vercel with a Turso database. Set the env vars above in the Vercel
project. `GET /api/health` returns `{status:"ok"}` when the DB is reachable.

---

## Scope

**In:** transcript review + scoring, four practice drills, live nudges, progress
tracking, Granola import, Deepgram transcription, allowlist auth, an MCP server.

**Out (by design):** multi-tenant, SSO, billing, public sign-up. Single operator,
invite-only.
