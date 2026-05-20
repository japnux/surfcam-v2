# No Bueno Webcams

A modern, responsive web application for viewing live surf webcams and detailed forecasts. Mobile-first, French language.

🔗 Production: [surfcam-v2.vercel.app](https://surfcam-v2.vercel.app)

## 🌊 Features

### Spot swiper (TV-style zapping)
- **Swipe between spots**: zap from one webcam to the next with a horizontal swipe (same principle as the companion Android TV app), plus arrows, pagination dots and keyboard navigation
- **Favorites swiper** (logged in): browse your favorite spots
- **Nearby spots swiper** (visitors): spots sorted by distance using browser geolocation, with a fallback to the Côte des Basques (Biarritz) reference point
- **Immersive landscape mode**: fullscreen button — true fullscreen + landscape lock on Android/desktop, CSS fullscreen overlay on iOS
- **Adjacent preloading**: the ±1 neighbouring streams stay warm for near-instant swipes

### Webcams & forecasts
- **Live webcams**: real-time HLS streaming (`hls.js`, native HLS on Safari)
- **Detailed forecasts**: hourly forecasts for 48h — wind, waves, swell, tides, weather
- **Dual forecast sources**:
  - Open-Meteo (free) for all spots
  - Stormglass (premium) for selected spots, with a daily call limit
- **Tides**: daily cached tide data, refreshed by a Vercel cron job

### Other
- **Smart sharing**: share a spot with a webcam snapshot — native share on mobile (Web Share API), clipboard + download fallback on desktop
- **User favorites**: save spots (requires authentication)
- **Mobile API**: CORS-enabled `/api/*` routes consumed by the companion iOS app
- **Admin**: spot management and Stormglass API usage monitoring

## 🛠 Tech stack

- [Next.js 14](https://nextjs.org/) (App Router) · React 18 · TypeScript
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/) — Postgres (`surf` schema), Auth, RLS
- Deployed on [Vercel](https://vercel.com/)

## 🚀 Getting started

### Prerequisites
- Node.js 18+
- A Supabase project (tables live in the `surf` schema — it must be added to the project's *Exposed schemas*)

### Setup

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# then fill in the values

# Start the dev server
npm run dev
```

The app runs on [http://localhost:3000](http://localhost:3000).

### Environment variables

See [`.env.example`](.env.example). Key variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project credentials |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase access (bypasses RLS) |
| `STORMGLASS_API_KEY` | Premium forecast source |
| `ADMIN_USER_IDS` | Comma-separated user IDs with admin access |
| `CRON_SECRET` | Bearer token protecting the cron endpoints |

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the codebase |
| `npm run scrape` | Run the spot scraper |
| `npm run update-shom` | Refresh SHOM tide data |

## ⏰ Cron jobs

A Vercel cron job (`vercel.json`) calls `/api/cron/fetch-tides` daily at 01:00 UTC to refresh cached tide data. The endpoint is protected by `CRON_SECRET`.

## 📱 Related project

A companion **Android TV** app provides the same zapping experience on the big screen — the web spot swiper is directly inspired by it.

## 🌐 Language

All user-facing content is in French.
