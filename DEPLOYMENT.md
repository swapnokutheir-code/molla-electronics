# মোল্লা ইলেকট্রনিক্স — Deployment Guide

> **Proprietor:** নুরুল ইসলাম মোল্লা, Faridpur, Bangladesh  
> **Version:** 2.0.0  
> **Last Updated:** August 30, 2026

---

## Project Overview

Molla Electronics is a complete shop management system built with **React + Vite** (single-file build). It includes billing, stock management, customer portal, expense tracking, and reporting — all in Bengali.

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Build Tool | Vite 6 (vite-plugin-singlefile) |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| Animations | framer-motion |
| State | localStorage (no backend needed) |
| PWA | manifest.json, theme-color |

---

## Live Deployment URLs

| Platform | URL | Status |
|----------|-----|--------|
| **Surge.sh** (Primary) | https://molla-electronics.surge.sh | ✅ Live |
| GitHub Pages (Backup) | https://swapnokutheir-code.github.io/molla-electronics/ | ✅ Live |
| Vercel (Legacy) | https://molla-electronics.vercel.app/ | ⚠️ Token expired |

---

## Step-by-Step Deployment Process

### Step 1 — Project Setup

```bash
# Vite + React + TypeScript project
npm create vite@latest molla-electronics -- --template react-ts
cd molla-electronics
npm install
```

Key dependencies installed:
```bash
npm install lucide-react framer-motion
npm install -D vite-plugin-singlefile tailwindcss
```

### Step 2 — Build Configuration

**`vite.config.ts`** was configured for single-file output:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
})
```

This inlines all JS and CSS into a single `index.html` — no external requests needed.

### Step 3 — Local Build

```bash
npm run build
```

**Output:**
```
✓ 2739 modules transformed
dist/index.html  1,145.20 kB │ gzip: 299.55 kB
✓ built in 7.29s
```

Everything is bundled into `dist/index.html` — a single self-contained file.

### Step 4 — GitHub Repository Setup

```bash
# Create repo on GitHub (via API or web UI)
# Repo: swapnokutheir-code/molla-electronics

# Initialize local git
git init
git config user.name "Red Bird International"
git config user.email "noreply@redbird.com"

# Copy pre-built dist/index.html to root (for GitHub Pages legacy mode)
cp dist/index.html index.html
cp public/manifest.json manifest.json

# Commit and push
git add -A
git commit -m "Molla Electronics v2.0 - Final Build"
git remote add origin https://github.com/swapnokutheir-code/molla-electronics.git
git push origin main
```

### Step 5 — GitHub Pages Deployment

```bash
# Enable GitHub Pages (legacy build type, serving from main branch root)
curl -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  https://api.github.com/repos/swapnokutheir-code/molla-electronics/pages \
  -d '{"source":{"branch":"main","path":"/"}}'

# Verify deployment
curl -sI https://swapnokutheir-code.github.io/molla-electronics/
# → HTTP/2 200, content-type: text/html
```

**Why legacy mode?** Since the build is a single `index.html`, no build step is needed on GitHub's side. The pre-built file is served directly from the repo root.

### Step 6 — Vercel Deployment (Initial)

```bash
# Login via device flow (OAuth)
vercel login

# Deploy from project directory
vercel --prod

# Result: https://molla-electronics.vercel.app/
```

**Note:** Vercel CLI token expired after the session. Re-authentication requires running `vercel login` again in an interactive terminal.

### Step 7 — Surge.sh Deployment (Primary)

```bash
# Install Surge CLI
npm install -g surge

# Generate a deployment token
SURGE_TOKEN=$(surge token)

# Deploy the dist folder to a custom subdomain
surge ./dist molla-electronics.surge.sh --token "$SURGE_TOKEN"
```

**Output:**
```
   project: ./dist
    domain: molla-electronics.surge.sh
      size: 4 files, 1.1 MB

  Success! - Published to molla-electronics.surge.sh
```

**Why Surge.sh?**
- Free, no credit card needed
- Clean, short URL
- Global CDN (10 edge locations: SF, London, Toronto, NYC, Amsterdam, Frankfurt, Singapore, Sydney, Tokyo, Bangalore)
- Automatic SSL/HTTPS
- No build step required — serves static files directly
- Token-based auth (no browser OAuth needed)

### Step 8 — Backend Integration (Base44)

A Base44 backend function (`serveMolla`) was deployed to serve as a redirect/entry point:

```typescript
// serveMolla.ts — redirects to the live site
export default async function serveMolla(req, res) {
  res.redirect(302, "https://molla-electronics.surge.sh");
}
```

### Step 9 — PWA Configuration

Added PWA support for installable app:

**`public/manifest.json`:**
```json
{
  "name": "মোল্লা ইলেকট্রনিক্স",
  "short_name": "মোল্লা ইলেকট্রনিক্স",
  "display": "standalone",
  "theme_color": "#4f46e5",
  "background_color": "#f8fafc",
  "icons": [...]
}
```

**`index.html` additions:**
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#4f46e5">
<meta name="apple-mobile-web-app-capable" content="yes">
```

---

## Redeployment Instructions

To deploy an updated version:

```bash
# 1. Make your code changes
cd molla-electronics

# 2. Build
npm run build

# 3. Copy built file to root
cp dist/index.html index.html

# 4. Push to GitHub (triggers Pages rebuild)
# (from a fresh git repo to avoid platform git issues)
rsync -a --exclude='node_modules' --exclude='dist' --exclude='.git' --exclude='.github' \
  ./ ../_push_temp/
cd ../_push_temp
git init && git add -A && git commit -m "Update"
git push origin main --force

# 5. Deploy to Surge.sh
surge ./dist molla-electronics.surge.sh --token "$SURGE_TOKEN"
```

---

## Features Deployed in v2.0

| Feature | Component | Description |
|---------|-----------|-------------|
| Billing System | `BillingSystem.tsx` | Invoice creation with IMEI tracking |
| Stock Management | `StockManagement.tsx` | Product inventory with low-stock alerts |
| Customer Portal | `CustomerPortal.tsx` | Purchase request submission & invoice viewing |
| Expense Management | `ExpenseManagement.tsx` | Shop expense tracking by category |
| Settings | `Settings.tsx` | Data backup/restore, password change |
| Reports | `Reports.tsx` | Sales analytics with net profit calculation |
| Customer Home | `CustomerHome.tsx` | Public product browsing with customer login |
| Login | `Login.tsx` | Admin authentication with custom password |
| Logo | `Logo.tsx` | Shop branding with proprietor photo |

---

## File Structure

```
molla-electronics/
├── index.html              # Pre-built single-file app (served by GitHub Pages)
├── manifest.json           # PWA manifest
├── package.json
├── vite.config.ts          # Vite + singlefile config
├── tsconfig.json
├── public/
│   ├── manifest.json       # PWA manifest (source)
│   ├── robots.txt
│   └── sitemap.xml
└── src/
    ├── main.tsx            # React entry point
    ├── App.tsx             # Main app with tab navigation
    ├── index.css           # Tailwind styles
    ├── types.ts            # TypeScript types
    ├── utils.ts            # localStorage helpers
    ├── assets/
    │   └── images/
    │       └── proprietor_real_photo.png
    └── components/
        ├── BillingSystem.tsx
        ├── StockManagement.tsx
        ├── CustomersList.tsx
        ├── Reports.tsx
        ├── CustomerHome.tsx
        ├── CustomerPortal.tsx
        ├── ExpenseManagement.tsx
        ├── Settings.tsx
        ├── Login.tsx
        ├── Logo.tsx
        └── Toast.tsx
```

---

## Account Credentials

| Service | Account | Notes |
|---------|---------|-------|
| GitHub | `swapnokutheir-code` | Repo owner |
| Surge.sh | `01772255247s@gmail.com` | Free plan |
| Vercel | `redbirdinccobd-1925` | Token needs refresh |
| Base44 | Agent `6a7c4932fc99670f477f810c` | Backend function hosting |

---

## Troubleshooting

**GitHub Pages not updating?**
- Wait 1-5 minutes for cache to clear
- Check Pages status: `curl -s -H "Authorization: Bearer $TOKEN" https://api.github.com/repos/swapnokutheir-code/molla-electronics/pages`
- Ensure `index.html` at root is the built version (1.1MB, not 5KB source)

**Vercel token expired?**
- Run `vercel login` in a terminal with browser access
- Or skip Vercel and use Surge.sh as primary

**Surge.sh deployment fails?**
- Regenerate token: `surge token`
- Verify dist folder exists: `ls -la dist/index.html`
- Retry: `surge ./dist molla-electronics.surge.sh --token "$NEW_TOKEN"`

---

*© 2026 মোল্লা ইলেকট্রনিক্স। সর্বস্বত্ব সংরক্ষিত।*
*তৈরি করেছে: মোল্লা টেক*
