# 📡 PayRadar

> **Track every recurring payment — rent, car leases, bills, subscriptions — in one private place.**
> Kira, araç kirası, fatura ve aboneliklerin hepsi tek yerde; verileriniz cihazınızda şifreli kalır.

PayRadar is a free, open-source recurring payment tracker that runs entirely in your browser. No accounts, no servers, no analytics — your data never leaves your device.

## ✨ Features

- 📊 **Instant overview** — monthly/yearly totals, active payments, next upcoming charge
- 🏠🚗🧾📺 **Everything recurring** — housing, transport, utilities, subscriptions, insurance, education… 9 categories
- 🔁 **Flexible cycles** — weekly, monthly, quarterly, yearly billing
- 🌍 **Multi-currency** — TRY / USD / EUR payments with editable exchange rates for TL totals
- 🗓️ **Renewal tracking** — color-coded countdown badges on every card
- 🔔 **Reminders** — browser notifications 1–7 days before renewal
- 🚫 **Cancellation guides** — step-by-step Turkish guides + direct links for Netflix, Spotify, BluTV, TOD, Game Pass and [17 more](src/data/guides.ts)
- 🌐 **Bilingual** — full Turkish & English UI (`tr` / `en`), auto-detected from your browser
- 🌙 **Dark mode** — follows system or manual override
- 📱 **PWA** — installable on phone/desktop, works fully offline

## 🔒 Security

| Measure | Detail |
|---|---|
| Optional PIN lock | 4–8 digits, set up in Settings → Security |
| AES-256-GCM encryption | Vault data encrypted at rest via WebCrypto |
| PBKDF2-SHA256 key derivation | 150,000 iterations; key lives **only in memory** |
| Hashed PIN | PIN itself is never stored — only a derived verify hash |
| Auto-lock | Locks after configurable inactivity (1/3/5/10 min) |
| Timing-safe comparison | Verify hash compared without early exit |
| Strict CSP & headers | `vercel.json` + `_headers` ship hardened defaults |
| Zero network calls | No analytics, no trackers, no third-party requests |

> ⚠️ Forgot your PIN? The data cannot be recovered — the lock screen offers a deliberate wipe option instead. This is by design.

## ☁️ Optional Cloud Sync (Free)

PayRadar works fully offline by default. Want your payments backed up under your own email and synced across devices? Enable free cloud sync in 3 minutes:

1. Create a free project at [supabase.com](https://supabase.com) (no credit card)
2. Open **SQL Editor** and run [`supabase-setup.sql`](supabase-setup.sql) — this creates a `vaults` table protected by Row Level Security, so **every user can only ever read/write their own row**
3. Copy `.env.example` → `.env` and paste your project URL + anon key

Restart the app — a new **Account ☁️** section appears in Settings. Sign up with any email; from then on every change auto-syncs. No account? Everything still works 100% locally.

## 🛠️ Tech

[![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=fff)](https://vitejs.dev)

Zero runtime dependencies beyond React. Hand-crafted CSS design system. ~75 KB gzipped total.

## 🚀 Getting started

```bash
git clone https://github.com/Voyagerroc/payradar.git
cd payradar
npm install
npm run dev        # dev server -> http://localhost:5173
npm run build      # production build -> dist/
npm run preview    # test the build locally
```

### 🌐 Live demo

**https://voyagerroc.github.io/payradar/** — install it straight from there.

### ☁️ Deploy

Works on any static host:

```bash
npx vercel         # Vercel — security headers included via vercel.json
```

Netlify: connect the repo (`_headers` is picked up automatically). GitHub Pages: publish `dist/` (add your own header meta if needed).

### 📲 Install as an app

Open the deployed URL in Chrome/Safari → **"Add to Home Screen"**. PayRadar then launches fullscreen and works offline.

## 🗺️ Roadmap

- [ ] CSV import/export (bank statement parsing)
- [ ] Price history chart — see subscription hikes at a glance
- [ ] Free-trial tracking ("card will be charged in X days")
- [ ] English cancellation guides for global services
- [ ] Web Share API for family plan splitting

## 🤝 Contributing

Adding a cancellation guide takes minutes: open [`src/data/guides.ts`](src/data/guides.ts), copy an entry, fill in `aliases`, `steps` and `cancelUrl`. Translations, bug fixes and features are welcome — fork, branch, PR!

```bash
git checkout -b feat/my-guide
git commit -m "feat: add cancellation guide for X"
```

## 📄 License

MIT — see [LICENSE](LICENSE).
