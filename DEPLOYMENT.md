# Deployment Guide

## Quick Deployment to Vercel

### Prerequisites
- GitHub account
- Vercel account
- Supabase project set up

### Steps

#### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

#### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure environment variables (see below)
5. Click **"Deploy"**

#### 3. Environment Variables

Add these in Vercel project settings:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SITE_NAME=GoSurf Webcams
OPEN_METEO_WEATHER_URL=https://api.open-meteo.com/v1/forecast
OPEN_METEO_MARINE_URL=https://marine-api.open-meteo.com/v1/marine
FORECAST_CACHE_TTL=900
ADMIN_USER_IDS=<your-user-id-after-first-login>
```

#### 4. Configure Supabase Auth

In your Supabase project:

1. Go to **Authentication → URL Configuration**
2. Add your Vercel domain to **Site URL**: `https://your-domain.vercel.app`
3. Add to **Redirect URLs**:
   - `https://your-domain.vercel.app/auth/callback`
   - `https://your-domain.vercel.app/**` (wildcard for preview deployments)

#### 5. Set Up Admin Access

1. Sign up on your deployed site
2. Go to Supabase → **Authentication → Users**
3. Copy your user ID
4. In Vercel → **Settings → Environment Variables**
5. Update `ADMIN_USER_IDS` with your user ID
6. Redeploy the project

#### 6. Custom Domain (Optional)

1. In Vercel project settings, go to **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_SITE_URL` in environment variables
5. Update Supabase Auth URLs with your custom domain

## Performance Optimization

### Caching Strategy

The app uses multiple caching layers:

1. **ISR (Incremental Static Regeneration)**
   - Spot pages: 15 minutes (`revalidate = 900`)
   - Automatically regenerates on Vercel Edge Network

2. **API Route Caching**
   - Forecast endpoint: 15 minutes server cache
   - Headers: `s-maxage=900, stale-while-revalidate=1800`

3. **Database Queries**
   - Leverages Supabase connection pooling
   - RLS policies for security without performance cost

### Monitoring

Enable Vercel Analytics:
1. Go to Vercel project → **Analytics**
2. Enable Web Analytics
3. Monitor Core Web Vitals

Target metrics:
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

## Database Maintenance

### Backups

Supabase Pro provides automatic backups. Free tier:
- Use Supabase Dashboard → **Database → Backups** to trigger manual backups
- Export SQL periodically

### Performance

Monitor slow queries:
1. Supabase → **Database → Query Performance**
2. Add indexes if needed (already included in schema)

### Cleanup

Optional: Set up a cron job to clean old forecast cache:

```sql
-- Delete forecast cache older than 7 days
DELETE FROM spot_forecast_cache 
WHERE fetched_at < NOW() - INTERVAL '7 days';
```

## Monitoring & Alerts

### Vercel

- Check **Deployments** for build status
- Monitor **Functions** for API route errors
- Review **Logs** for runtime issues

### Supabase

- Monitor **Database** health
- Check **Auth** logs for failed logins
- Review **API** usage

### Uptime Monitoring

Use a service like:
- UptimeRobot
- Pingdom
- Better Uptime

Monitor:
- Homepage: `https://your-domain.com`
- API health: `https://your-domain.com/api/forecast?lat=43.6604&lon=-1.4122`

## Security Checklist

- [ ] RLS policies enabled on all tables
- [ ] Service role key stored securely (server-only)
- [ ] ADMIN_USER_IDS configured
- [ ] Auth redirect URLs configured
- [ ] Environment variables not committed to Git
- [ ] HTTPS enabled (automatic with Vercel)

## Troubleshooting

### Build Failures

Check Vercel build logs for:
- Missing environment variables
- TypeScript errors
- Dependency issues

### Runtime Errors

1. Check Vercel Functions logs
2. Verify Supabase connection
3. Test API endpoints directly

### Slow Performance

1. Check Vercel Analytics for bottlenecks
2. Review database query performance
3. Verify caching headers are working
4. Consider upgrading Vercel plan for better edge performance

## Rollback

If a deployment has issues:

1. Go to Vercel → **Deployments**
2. Find the last working deployment
3. Click **"⋯"** → **"Promote to Production"**

## Scaling

The app is designed to scale horizontally:

- **Serverless Functions**: Auto-scale with Vercel
- **Edge Caching**: CDN serves static/cached content
- **Database**: Supabase handles connection pooling
- **Media**: Webcams served directly from source

For high traffic:
- Consider Vercel Pro for better limits
- Upgrade Supabase plan for more connections
- Add Redis for application-level caching

---

**Your GoSurf Webcams app is now live! 🌊🏄‍♂️**
