# GoSurf Webcams

A modern, responsive web application for viewing live surf webcams and detailed forecasts, inspired by Surfline.

## 🌊 Features

- **Live Webcams**: View real-time surf conditions from multiple spots
- **Detailed Forecasts**: Hourly forecasts for 7 days with wind, waves, tides, and weather
- **User Favorites**: Save your favorite spots (requires authentication)
- **Magic Link Auth**: Secure, passwordless authentication via email
- **Admin Panel**: CRUD operations for managing spots
- **SEO Optimized**: Complete metadata, OG images, sitemaps, and structured data
- **Responsive Design**: Mobile-first, works on all devices
- **French Language**: All content in French

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript, RSC)
- **Styling**: TailwindCSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth (Magic Links)
- **Forecasts**: Open-Meteo API (weather + marine data)
- **Video**: Native HTML5 video with lazy-loaded HLS.js
- **Deployment**: Vercel (with ISR)

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase project
- Vercel account (for deployment)

## 🚀 Getting Started

### 1. Clone and Install

```bash
cd "Surfcam v2"
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema:
   ```bash
   # Copy contents of supabase/schema.sql
   ```
3. Optionally seed with sample data:
   ```bash
   # Copy contents of supabase/seed.sql
   ```
4. Get your project URL and keys from **Settings → API**

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="GoSurf Webcams"

# APIs (defaults are fine)
OPEN_METEO_WEATHER_URL=https://api.open-meteo.com/v1/forecast
OPEN_METEO_MARINE_URL=https://marine-api.open-meteo.com/v1/marine

# Cache (900 = 15 minutes)
FORECAST_CACHE_TTL=900

# Admin (add your Supabase user ID after first login)
ADMIN_USER_IDS=
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Set Up Admin Access

1. Sign up via the app (http://localhost:3000/auth/login)
2. Check your Supabase **Authentication → Users** for your user ID
3. Add your user ID to `ADMIN_USER_IDS` in `.env.local`
4. Restart the dev server
5. Access admin at http://localhost:3000/admin

## 📁 Project Structure

```
├── app/                      # Next.js App Router
│   ├── (pages)/             # Public pages
│   │   ├── page.tsx         # Home
│   │   ├── spots/           # Spots list & detail
│   │   ├── favorites/       # User favorites
│   │   └── profile/         # User profile
│   ├── admin/               # Admin panel
│   ├── auth/                # Auth pages
│   ├── api/                 # API routes
│   │   ├── auth/            # Auth endpoints
│   │   ├── favorites/       # Favorites CRUD
│   │   ├── forecast/        # Forecast proxy
│   │   ├── tides/           # Tides proxy
│   │   ├── og/              # OG image generation
│   │   └── admin/           # Admin CRUD endpoints
│   ├── layout.tsx           # Root layout
│   ├── globals.css          # Global styles
│   ├── sitemap.ts           # Dynamic sitemap
│   └── robots.ts            # Robots.txt
├── components/              # React components
│   ├── ui/                  # shadcn/ui base components
│   ├── video-player.tsx     # Video player with HLS
│   ├── forecast-table.tsx   # Hourly forecast table
│   ├── conditions-banner.tsx# Current conditions
│   ├── search-bar.tsx       # Search with debounce
│   ├── spot-card.tsx        # Spot preview card
│   ├── favorite-button.tsx  # Favorite toggle
│   └── header.tsx           # App header/nav
├── lib/                     # Utilities & logic
│   ├── supabase/            # Supabase clients & types
│   ├── data/                # Data access layer
│   │   ├── spots.ts         # Spot queries
│   │   ├── favorites.ts     # Favorites queries
│   │   └── profiles.ts      # Profile queries
│   ├── api/                 # External API integrations
│   │   ├── forecast.ts      # Open-Meteo forecast
│   │   └── tides.ts         # Tide calculations
│   ├── auth/                # Auth helpers
│   │   └── admin.ts         # Admin guard
│   ├── utils.ts             # Shared utilities
│   └── config.ts            # App configuration
├── supabase/                # Database files
│   ├── schema.sql           # DB schema + RLS policies
│   └── seed.sql             # Sample data
├── scripts/                 # Utility scripts
│   └── scraper.ts           # GoSurf.fr scraper template
└── middleware.ts            # Auth middleware
```

## 🗄️ Database Schema

### Tables

- **profiles**: User profiles (id, email, display_name, locale)
- **spots**: Surf spots (name, slug, location, webcam URL, metadata)
- **favorites**: User favorites (user_id, spot_id)
- **spot_forecast_cache**: Cached forecast data (optional)

### RLS Policies

- Users can read/update their own profile
- Anyone can read active spots
- Users can manage their own favorites
- Admin operations require service role or admin check

## 🔐 Authentication

- **Magic Link**: Passwordless email authentication via Supabase Auth
- **Profile Creation**: Auto-created on first login
- **Admin Access**: Controlled by `ADMIN_USER_IDS` environment variable

## 🎨 Customization

### Branding

Edit `lib/config.ts`:
- Site name
- Base URL
- Home spot count
- Cache TTL
- Brand colors

### Styling

Edit `app/globals.css` to customize the design system (colors, spacing, etc.)

## 📊 Forecasts & Tides

- **Source**: Open-Meteo (free, no API key required)
- **Data**: Wind, waves, swell, temperature, precipitation, pressure, UV
- **Caching**: 15 minutes server-side (configurable)
- **Tides**: Simplified sinusoidal calculation (replace with real API in production)

## 🔧 Admin Features

Accessible at `/admin` (requires admin user ID):

- **View All Spots**: See active and inactive spots
- **Create Spot**: Add new spots with full validation
- **Edit Spot**: Update spot details
- **Delete Spot**: Remove spots (with confirmation)
- **Test Stream**: Preview webcam and forecast data
- **Toggle Active**: Enable/disable spots

## 🚢 Deployment

### Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add all environment variables from `.env.local`
4. Deploy!

### Environment Variables for Production

Don't forget to set in Vercel:
- All Supabase credentials
- `NEXT_PUBLIC_SITE_URL` (your production URL)
- `ADMIN_USER_IDS` (comma-separated)

### ISR Configuration

Spot pages use ISR with 15-minute revalidation. Configure in:
- `app/spots/[slug]/page.tsx`: `export const revalidate = 900`

## 📈 SEO

- **Metadata**: Dynamic titles, descriptions, canonical URLs
- **Open Graph**: Per-spot OG images with spot name and region
- **Structured Data**: JSON-LD for WebSite (home) and Place (spots)
- **Sitemap**: Auto-generated from active spots (`/sitemap.xml`)
- **Robots**: Present at `/robots.txt`

## 🧪 Testing Checklist

- [ ] Sign up with magic link
- [ ] Add/remove favorites
- [ ] Search spots by name and city
- [ ] View spot page with video, conditions, and forecast
- [ ] Simulate stream failure (invalid URL)
- [ ] Admin CRUD operations
- [ ] Test stream and preview forecast in admin
- [ ] Verify OG images render
- [ ] Check sitemap includes all spots
- [ ] Validate JSON-LD structured data

## 🐛 Troubleshooting

### Video Not Loading
- Check `cam_url` is correct and accessible
- Verify `cam_type` matches the stream format
- For HLS (.m3u8), ensure CORS is enabled on the source

### Forecast Errors
- Check Open-Meteo API is accessible
- Verify latitude/longitude are valid
- Check network/CORS issues

### Admin Access Denied
- Verify your user ID is in `ADMIN_USER_IDS`
- Check environment variable is loaded (restart dev server)
- Ensure user is logged in

### Database Errors
- Verify RLS policies are correctly set up
- Check Supabase credentials in `.env.local`
- Ensure schema is applied

## 📝 Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Linting
npm run lint

# Scraper (template)
npm run scrape
```

## 🔮 Future Enhancements (Not in V1)

- Charts/graphs for forecast visualization
- Interactive map with spot markers
- Condition scoring/rating system
- Analytics integration
- PWA/offline support
- Multi-language support
- Mobile apps (React Native)
- User-uploaded photos/reports
- Advanced filters (swell size, wind, etc.)

## 📄 License

MIT License - see LICENSE file

## 🙏 Credits

- Forecast data: [Open-Meteo](https://open-meteo.com/)
- UI components: [shadcn/ui](https://ui.shadcn.com/)
- Icons: [Lucide](https://lucide.dev/)
- Spot data source: GoSurf.fr (assumed with permission)

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Built with ❤️ for the surf community** 🏄‍♂️🌊
