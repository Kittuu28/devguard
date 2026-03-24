# DevGuard — Secure CI/CD Monitoring Agent

> Built for the Auth0 "Authorized to Act" Hackathon

DevGuard is an AI agent that monitors your GitHub repositories for CI/CD failures and automatically takes action — opening issues and alerting your team on Slack — all acting on behalf of the authenticated developer using **Auth0 for AI Agents Token Vault**.

## Live Demo

**App:** https://devguard-4c1w.vercel.app

**Demo video:** [YouTube link]

---

## What It Does

1. **Detects CI failures** — checks GitHub Actions for failing workflows
2. **Opens GitHub issues** — automatically creates tracking issues as the authenticated user
3. **Sends Slack alerts** — notifies your team channel with a direct link to the issue

All actions are performed using OAuth tokens retrieved at runtime from Auth0 Token Vault — no hardcoded secrets, no shared service accounts.

---

## Security Model

- **Zero secrets in code** — API keys never stored in environment variables or config files at agent level
- **User-scoped access** — every action is tied to the authenticated user's identity
- **Runtime token retrieval** — tokens fetched from Auth0 Token Vault only during active execution
- **Revocable access** — users can revoke agent permissions at any time from Auth0 dashboard
- **Least privilege** — minimal OAuth scopes: `repo`, `read:org`, `chat:write`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Agent framework | LangGraph.js |
| Auth & Token Vault | Auth0 for AI Agents |
| Frontend | Next.js 15 |
| LLM | Claude Haiku (Anthropic) |
| CI monitoring | GitHub Actions API |
| Alerts | Slack API |
| Deployment | Vercel |

---

## Local Setup

### Prerequisites

- Node.js 18+
- Auth0 account (free tier works)
- GitHub OAuth App
- Slack App with bot token
- Anthropic API key

### Step 1 — Clone the repo

```bash
git clone https://github.com/Kittuu28/devguard.git
cd devguard
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Configure environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local` (see below for how to get each one).

### Step 4 — Auth0 Setup

1. Go to [auth0.com](https://auth0.com) and create a free account
2. Create a new **Regular Web Application**
3. Under Settings → Application URIs set:
   - Allowed Callback URLs: `http://localhost:3000/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`
4. Under Advanced → Grant Types, enable **Authorization Code** and **Refresh Token**
5. Go to Authentication → Social → GitHub → create connection
   - Set Purpose to: **Authentication and Connected Accounts for Token Vault**
   - Add your GitHub OAuth App Client ID and Secret
6. Go to Applications → APIs → Auth0 My Account API → activate it
7. Create a custom API with identifier `https://devguard.local/api`
8. Go to Applications → APIs → Auth0 Management API → API Explorer → copy the management token

### Step 5 — GitHub OAuth App

1. Go to GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App
2. Set Authorization callback URL to: `https://YOUR-TENANT.auth0.com/login/callback`
3. Copy Client ID and Client Secret into Auth0 GitHub Social Connection

### Step 6 — Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → Create New App → From scratch
2. Under OAuth & Permissions → Bot Token Scopes add: `chat:write`, `channels:read`, `channels:join`
3. Add Redirect URL: `https://YOUR-TENANT.auth0.com/login/callback`
4. Install to workspace and copy the Bot User OAuth Token

### Step 7 — Run the app

```bash
npm run all:dev
```

This starts both the Next.js app at `http://localhost:3000` and the LangGraph server at `http://localhost:54367`.

---

## How to Use

1. Open `http://localhost:3000`
2. Log in with GitHub via Auth0
3. Type in the chat:

```
Check CI failures in YOUR-GITHUB-USERNAME/YOUR-REPO
```

4. Then:

```
Open a GitHub issue for the most recent failure
```

The agent will find failures, create a GitHub issue, and send a Slack alert — all as you, using your credentials from Auth0 Token Vault.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[auth0]/    ← Auth0 route handler
│   │   └── chat/[..._path]/ ← LangGraph API passthrough
│   └── page.tsx             ← Chat UI
├── lib/
│   ├── agent.ts             ← LangGraph agent definition
│   ├── auth.ts              ← JWT authentication handler
│   ├── auth0.ts             ← Auth0 client configuration
│   └── tools/
│       ├── github.ts        ← GitHub API tools
│       └── slack.ts         ← Slack API tools
└── components/
    └── chat-window.tsx      ← Chat UI component
```

---

## License

MIT
