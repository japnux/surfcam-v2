export const config = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'No Bueno Webcams',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  locale: 'fr',
  
  // Number of spots to display on home page
  homeSpotCount: 12,
  
  // Cache TTL in seconds (default 15 minutes)
  forecastCacheTTL: parseInt(process.env.FORECAST_CACHE_TTL || '900', 10),
  
  // Open-Meteo API URLs (fallback for spots without daily forecast)
  openMeteo: {
    weatherUrl: process.env.OPEN_METEO_WEATHER_URL || 'https://api.open-meteo.com/v1/forecast',
    marineUrl: process.env.OPEN_METEO_MARINE_URL || 'https://marine-api.open-meteo.com/v1/marine',
  },
  
  // Stormglass API (for premium spots with daily forecast - 10 calls/day limit)
  stormglass: {
    apiKey: process.env.STORMGLASS_API_KEY || '',
    baseUrl: 'https://api.stormglass.io/v2',
  },
  
  // Admin user IDs (comma-separated)
  adminUserIds: process.env.ADMIN_USER_IDS?.split(',').filter(Boolean) || [],
  
  // Brand colors
  colors: {
    good: '#10b981', // green
    warning: '#f59e0b', // yellow
    bad: '#ef4444', // red
    primary: '#0ea5e9', // sky blue
  },
}
