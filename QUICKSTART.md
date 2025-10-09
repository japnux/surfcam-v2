# Quick Start Guide

Get your No Bueno Webcams app running in minutes!

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Supabase Database

### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned

### Apply the Schema
1. In Supabase Dashboard, go to **SQL Editor**
2. Create a new query
3. Copy the entire contents of `supabase/schema.sql`
4. Paste and click **Run**

### Seed Sample Data (Optional)
1. In SQL Editor, create another new query
2. Copy the contents of `supabase/seed.sql`
3. Paste and click **Run**

This will create 12 sample surf spots in France.

## 3. Configure Environment

### Get Supabase Credentials
1. In Supabase Dashboard, go to **Settings → API**
2. Copy the **Project URL** and **anon public** key
3. Copy the **service_role** key (keep this secret!)

### Set Up .env.local
Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="No Bueno Webcams"

# APIs (leave as-is)
OPEN_METEO_WEATHER_URL=https://api.open-meteo.com/v1/forecast
OPEN_METEO_MARINE_URL=https://marine-api.open-meteo.com/v1/marine

# Cache TTL in seconds (15 minutes)
FORECAST_CACHE_TTL=900

# Admin access (leave empty for now)
ADMIN_USER_IDS=
```

## 4. Run the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 5. Set Up Admin Access

### Sign Up
1. Go to [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
2. Enter your email
3. Check your email for the magic link
4. Click the link to sign in

### Get Your User ID
1. Go to Supabase Dashboard → **Authentication → Users**
2. Find your user and copy the **UUID**

### Add Admin Access
1. Edit `.env.local`
2. Set `ADMIN_USER_IDS=your-uuid-here`
3. Restart the dev server: `Ctrl+C` then `npm run dev`

### Access Admin Panel
Visit [http://localhost:3000/admin](http://localhost:3000/admin)

## 6. Next Steps

### Add Real Webcams
The sample data has placeholder webcam URLs. To add real webcams:

1. Go to admin panel
2. Click on a spot to edit
3. Update the `cam_url` with a real HLS stream URL
4. Save

### Create New Spots
1. Click **"New Spot"** in admin
2. Fill in all required fields:
   - Name
   - Slug (auto-generated from name)
   - Country, Region, City
   - Latitude, Longitude
   - Webcam URL and type
3. Save

### Test Everything
- ✅ Browse spots on homepage
- ✅ Search for spots by name or city
- ✅ View a spot page with video and forecast
- ✅ Add/remove favorites
- ✅ Edit your profile
- ✅ Admin CRUD operations

## Common Issues

### "Cannot connect to Supabase"
- Check your Supabase URL and keys in `.env.local`
- Verify your Supabase project is running
- Restart the dev server

### "Video not loading"
- Sample webcam URLs are placeholders
- Add real HLS/MP4 webcam URLs in admin

### "Admin access denied"
- Make sure you've added your user ID to `ADMIN_USER_IDS`
- Restart the dev server after changing `.env.local`

### "Forecast not loading"
- Check your internet connection
- Verify Open-Meteo API is accessible
- Sample spots have valid coordinates

## Ready to Deploy?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel deployment instructions.

---

**Happy surfing! 🏄‍♂️🌊**
