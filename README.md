# VIRAL2026 v3.0 — Hostinger Deployment Guide

AI viral video script generator using **Groq** (FREE) + Node.js + Express.
Zero cost per video. Works on Hostinger Business plan or Cloud hosting.

---

## 🚀 5-Minute Deploy to Hostinger

### Step 1: Get your FREE Groq API key
1. Go to https://console.groq.com/keys
2. Sign up (free, no credit card)
3. Click **Create API Key** → copy it (starts with `gsk_...`)

### Step 2: Zip the project folder
On your computer, zip the whole `viral2026` folder:
- `server.js`
- `package.json`
- `public/index.html`

File name: `viral2026.zip`

### Step 3: Upload to Hostinger
1. Log in to **hPanel** (https://hpanel.hostinger.com)
2. Click **Websites** → **Add Website**
3. Choose **Node.js Apps**
4. Pick **"Other"** as framework type
5. Upload `viral2026.zip`
6. Set:
   - **Entry file:** `server.js`
   - **Node version:** 18 or higher

### Step 4: Set the API key (critical!)
1. In hPanel, open your Node.js app settings
2. Find **Environment Variables** section
3. Add these TWO variables:

| Key | Value |
|-----|-------|
| `GROQ_API_KEY` | `gsk_...your_key_here` |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |

4. Click **Save** and **Restart** the app

### Step 5: Open your site
Visit your domain — you're live! Open on mobile or desktop, works identically.

---

## 🧪 Local Testing (optional)

```bash
cd viral2026
npm install
GROQ_API_KEY=gsk_your_key node server.js
# Open http://localhost:3000
```

---

## 💰 Cost Breakdown

- **Groq API:** FREE (current limits: 30 req/min, 14,400 req/day — way more than you'll ever need)
- **Hostinger Business:** you already have it
- **Per video:** $0.00

If Groq ever throttles you, switch `GROQ_MODEL` to `gpt-oss-120b` or `llama-3.1-8b-instant` in env vars.

---

## 📦 What Each File Does

| File | Purpose |
|------|---------|
| `server.js` | Node.js + Express backend. 7 API endpoints that proxy Groq. Never exposes your API key to users. |
| `package.json` | Lists dependencies (just Express). Hostinger runs `npm install` automatically. |
| `public/index.html` | Full frontend. No build step needed — uploads as-is. |

---

## 🔐 Security

- Your Groq API key lives ONLY in Hostinger env vars — never in the frontend code
- Users can't see or steal your key
- Same origin requests only (no CORS leaks)

---

## 🆘 Troubleshooting

**"Load failed" error:** Check env variables are set, restart the Node app in hPanel.

**"Missing GROQ_API_KEY":** You skipped Step 4. Set it in hPanel and restart.

**Rate limited:** Switch `GROQ_MODEL` to `llama-3.1-8b-instant` (same free tier, even higher limits).

**Copy buttons not working:** Make sure your Hostinger domain is HTTPS (it is by default). Clipboard API requires secure context.

---

## 🎯 What's New in v3.0

1. **Step 0: Analyze** — AI first studies YOUR business (pain point, hot button, angle) before writing anything. No more generic hooks.
2. **Unique hooks every time** — Different patterns forced per generation, informed by niche analysis.
3. **Bulletproof Video AI Prompt** — NO brand names, NO phone numbers, NO fake logos. Only universal phrases like "GET APPROVED", "LOW DOWN", "BAD CREDIT OK" that video AIs render cleanly.
4. **Apply Fix with visual confirmation** — Buttons turn green, show "✓ Applied" when used.
5. **Working Copy buttons** — Fallback using `document.execCommand` for older browsers.
6. **Full shot-by-shot script** — Camera angle, action, visual, text overlay, transition, facial expression — all per segment.
