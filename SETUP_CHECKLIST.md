# Setup Checklist

Use this checklist to set up your GoSurf Webcams application.

## Local Development Setup

### 1. Dependencies
- [ ] Run `npm install`
- [ ] Verify no critical errors in installation

### 2. Supabase Database
- [ ] Create Supabase project at [supabase.com](https://supabase.com)
- [ ] Copy `supabase/schema.sql` to SQL Editor
- [ ] Execute schema to create tables and RLS policies
- [ ] Copy `supabase/seed.sql` to SQL Editor (optional)
- [ ] Execute seed data to create 12 sample spots
- [ ] Verify tables exist: profiles, spots, favorites, spot_forecast_cache

### 3. Environment Configuration
- [ ] Copy `.env.example` to `.env.local`
- [ ] Get Supabase URL from Settings → API
- [ ] Get Supabase anon key from Settings → API
- [ ] Get Supabase service_role key from Settings → API
- [ ] Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- [ ] Leave `ADMIN_USER_IDS` empty for now

### 4. First Run
- [ ] Run `npm run dev`
- [ ] Open http://localhost:3000
- [ ] Verify home page loads with 12 sample spots
- [ ] Test search functionality

### 5. Authentication Setup
- [ ] Go to http://localhost:3000/auth/login
- [ ] Sign up with your email
- [ ] Check email for magic link
- [ ] Click magic link to authenticate
- [ ] Verify you're redirected and logged in

### 6. Admin Access
- [ ] Go to Supabase → Authentication → Users
- [ ] Copy your user UUID
- [ ] Edit `.env.local`
- [ ] Set `ADMIN_USER_IDS=your-uuid-here`
- [ ] Restart dev server (`Ctrl+C` then `npm run dev`)
- [ ] Visit http://localhost:3000/admin
- [ ] Verify admin panel is accessible

### 7. Test Core Features
- [ ] Browse spots on home page
- [ ] Click on a spot to view detail page
- [ ] Verify video player loads (may show error with sample URLs)
- [ ] Check forecast table displays 48 hours of data
- [ ] Add spot to favorites (heart icon)
- [ ] Go to /favorites and verify spot appears
- [ ] Remove from favorites
- [ ] Test search by spot name
- [ ] Test search by city name
- [ ] View and update profile at /profile
- [ ] Test logout

### 8. Admin Features
- [ ] Go to /admin
- [ ] Click "New Spot" and create a test spot
- [ ] Fill all required fields (name, slug, coordinates, cam URL)
- [ ] Save and verify it appears in admin list
- [ ] Edit the test spot
- [ ] Test stream feature (may show error with invalid URLs)
- [ ] Preview forecast for the spot
- [ ] Delete the test spot
- [ ] Confirm deletion works

### 9. Add Real Webcam URLs (Optional)
- [ ] Find real HLS or MP4 webcam streams
- [ ] Edit sample spots in admin
- [ ] Replace `cam_url` with real stream URLs
- [ ] Set correct `cam_type` (hls, mp4, webm)
- [ ] Test stream in admin panel
- [ ] Verify video plays on spot page

## Production Deployment

### 10. Pre-Deployment
- [ ] Test all features work locally
- [ ] Commit code to Git repository
- [ ] Push to GitHub

### 11. Vercel Setup
- [ ] Create Vercel account at [vercel.com](https://vercel.com)
- [ ] Import GitHub repository
- [ ] Add all environment variables:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_SITE_URL` (your Vercel URL)
  - [ ] `NEXT_PUBLIC_SITE_NAME`
  - [ ] `OPEN_METEO_WEATHER_URL`
  - [ ] `OPEN_METEO_MARINE_URL`
  - [ ] `FORECAST_CACHE_TTL`
  - [ ] `ADMIN_USER_IDS`
- [ ] Deploy

### 12. Supabase Production Config
- [ ] Go to Supabase → Authentication → URL Configuration
- [ ] Set Site URL to your Vercel domain
- [ ] Add redirect URLs:
  - [ ] `https://your-domain.vercel.app/auth/callback`
  - [ ] `https://your-domain.vercel.app/**`
- [ ] Save configuration

### 13. Post-Deployment Testing
- [ ] Visit deployed site
- [ ] Test sign up with magic link
- [ ] Verify email arrives and login works
- [ ] Test all core features on production
- [ ] Check admin panel works
- [ ] Test on mobile device
- [ ] Verify SEO elements:
  - [ ] Visit /sitemap.xml
  - [ ] Visit /robots.txt
  - [ ] Check OG image at /api/og
- [ ] Test performance with Lighthouse

### 14. Custom Domain (Optional)
- [ ] Add custom domain in Vercel
- [ ] Configure DNS records
- [ ] Update `NEXT_PUBLIC_SITE_URL` in Vercel env vars
- [ ] Update Supabase auth redirect URLs
- [ ] Redeploy

### 15. Monitoring & Maintenance
- [ ] Enable Vercel Analytics
- [ ] Set up uptime monitoring
- [ ] Configure Supabase backups
- [ ] Monitor database usage
- [ ] Review error logs regularly

## Content Management

### 16. Add Real Spots
- [ ] Research surf spots with webcams
- [ ] Get coordinates (lat/long)
- [ ] Find webcam stream URLs
- [ ] Add spots via admin panel
- [ ] Test each stream works
- [ ] Add metadata (break type, level, etc.)
- [ ] Activate spots

### 17. Maintain Data
- [ ] Regularly check webcam streams
- [ ] Update inactive/broken streams
- [ ] Add new spots as available
- [ ] Moderate user favorites if needed
- [ ] Clean up old forecast cache (optional)

## Troubleshooting

### Common Issues
- [ ] Video not loading → Check webcam URL and CORS
- [ ] Forecast errors → Verify coordinates are valid
- [ ] Auth issues → Check Supabase redirect URLs
- [ ] Admin blocked → Verify user ID in env vars
- [ ] Build errors → Check all dependencies installed

### Support Resources
- [ ] README.md - Full documentation
- [ ] QUICKSTART.md - Quick setup guide
- [ ] DEPLOYMENT.md - Deployment instructions
- [ ] GitHub Issues - Report bugs

---

## ✅ Setup Complete!

Once all checkboxes are marked, your GoSurf Webcams app is ready!

**Happy surfing! 🏄‍♂️🌊**
