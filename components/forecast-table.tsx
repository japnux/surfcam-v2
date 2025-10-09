import { HourlyForecast, DailyData } from '@/lib/api/forecast'
import { HourlyTide, TideEvent } from '@/lib/api/tides'
import {
  formatWaveHeight,
  formatWindSpeed,
  formatTemperature,
  formatPeriod,
  formatSwellPower,
  getWindDirectionArrow,
} from '@/lib/utils'

function formatWaveEnergy(kj: number | null | undefined): string {
  if (!kj) return '-'
  return `${kj.toFixed(1)} kJ/m²`
}
import { Sunrise, Sunset, Waves, ArrowUp, ArrowDown } from 'lucide-react'

interface ForecastTableProps {
  hourly: HourlyForecast[]
  tideHourly?: HourlyTide[]
  tideEvents?: TideEvent[]
  daily?: DailyData[]
  hoursToShow?: number
}

export function ForecastTable({ hourly, tideHourly, tideEvents, daily, hoursToShow = 48 }: ForecastTableProps) {
  // Obtenir l'heure courante en UTC (comme les données de l'API)
  const now = new Date()
  // Les données de l'API sont en UTC, donc on compare en UTC
  const nowTimestamp = Date.now()
  
  // Filtrer les prévisions pour ne garder que celles >= à l'heure courante
  // Les timestamps sont déjà en UTC dans hour.time
  const futureForecasts = hourly.filter(hour => new Date(hour.time).getTime() >= nowTimestamp)
  const displayData = futureForecasts.slice(0, hoursToShow)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-secondary z-10">
          <tr className="border-b border-border">
            <th className="p-3 text-left font-semibold">Heure</th>
            <th className="p-3 text-left font-semibold">Vent</th>
            <th className="p-3 text-left font-semibold">Vagues</th>
            <th className="p-3 text-left font-semibold">Marée</th>
            <th className="p-3 text-left font-semibold">Énergie</th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((hour, index) => {
            const date = new Date(hour.time)
            
            // Find corresponding tide height
            const tideData = tideHourly?.find(t => {
              const tideTime = new Date(t.time)
              return Math.abs(tideTime.getTime() - date.getTime()) < 30 * 60 * 1000 // Within 30 minutes
            })
            
            // Determine if tide is rising or falling based on next tide event
            const isTideRising = tideData && tideEvents ? (() => {
              const currentTime = date.getTime()
              // Find the next tide event (high or low)
              const nextEvent = tideEvents.find(e => new Date(e.time).getTime() > currentTime)
              if (!nextEvent) return null
              // If next event is high tide, we're rising. If low tide, we're falling.
              return nextEvent.type === 'high'
            })() : null
            const timeStr = date.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })
            const dateStr = date.toLocaleDateString('fr-FR', {
              weekday: 'short',
              day: 'numeric',
            })
            const fullDateStr = date.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })
            
            // Check if this is a new day (00:00 or first entry)
            const prevDate = index > 0 ? new Date(displayData[index - 1].time) : null
            const isNewDay = !prevDate || prevDate.getDate() !== date.getDate()
            
            // Get sunrise/sunset for this day
            const dayData = daily?.find(d => {
              const dailyDate = new Date(d.sunrise || d.sunset)
              return dailyDate.getDate() === date.getDate() && 
                     dailyDate.getMonth() === date.getMonth()
            })
            
            const sunrise = dayData?.sunrise ? new Date(dayData.sunrise) : null
            const sunset = dayData?.sunset ? new Date(dayData.sunset) : null
            
            // Check if we should show sunrise/sunset in this row
            const nextHour = index < displayData.length - 1 ? new Date(displayData[index + 1].time) : null
            const showSunrise = sunrise && date <= sunrise && (!nextHour || nextHour > sunrise)
            const showSunset = sunset && date <= sunset && (!nextHour || nextHour > sunset)
            
            // Check if we should show tide events (high/low) AFTER this row
            const tideEvent = tideEvents?.find(t => {
              const tideTime = new Date(t.time)
              // Show tide event if it occurs between current hour and next hour
              return date < tideTime && (!nextHour || nextHour >= tideTime)
            })

            return (
              <>
                {isNewDay && (
                  <tr className="bg-primary/10 border-t-2 border-t-primary/40">
                    <td colSpan={5} className="p-2 text-sm font-semibold text-primary">
                      {fullDateStr.charAt(0).toUpperCase() + fullDateStr.slice(1)}
                    </td>
                  </tr>
                )}
                
                {/* Sunrise row */}
                {showSunrise && sunrise && (
                  <tr key={`sunrise-${sunrise.toISOString()}`} className="bg-orange-500/10 border-y border-orange-500/30">
                    <td className="p-2 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Sunrise className="h-4 w-4 text-orange-500" />
                        <span>{sunrise.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td colSpan={4} className="p-2 text-sm text-muted-foreground">
                      Lever du soleil
                    </td>
                  </tr>
                )}
                
                {/* Sunset row */}
                {showSunset && sunset && (
                  <tr key={`sunset-${sunset.toISOString()}`} className="bg-orange-600/10 border-y border-orange-600/30">
                    <td className="p-2 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Sunset className="h-4 w-4 text-orange-600" />
                        <span>{sunset.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td colSpan={4} className="p-2 text-sm text-muted-foreground">
                      Coucher du soleil
                    </td>
                  </tr>
                )}
                
                <tr
                  key={hour.time}
                  className={`border-b border-border hover:bg-accent/50 transition-colors ${
                    index % 3 === 0 ? 'bg-accent/20' : ''
                  }`}
                >
                  <td className="p-3 font-medium whitespace-nowrap">
                    <div>{timeStr}</div>
                    <div className="text-xs text-muted-foreground">{dateStr}</div>
                  </td>
                
                {/* Vent: direction + force + rafales */}
                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-lg" style={{ fontVariantEmoji: 'text' }}>{getWindDirectionArrow(hour.windDirection)}</span>
                    <span className="font-semibold">{formatWindSpeed(hour.windSpeed)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Raf: {formatWindSpeed(hour.windGust)}
                  </div>
                </td>
                
                {/* Vagues: direction + taille + période */}
                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-lg" style={{ fontVariantEmoji: 'text' }}>{getWindDirectionArrow(hour.waveDirection)}</span>
                    <span className="font-semibold text-blue-500">
                      {formatWaveHeight(hour.waveHeight)} - {formatPeriod(hour.wavePeriod)}
                    </span>
                  </div>
                  {hour.swellPower && hour.swellPower > 0 && (
                    <div className="text-xs text-blue-400 mt-0.5">
                      ⚡ {formatSwellPower(hour.swellPower)}
                    </div>
                  )}
                </td>
                
                {/* Tide Height */}
                <td className="p-3">
                  {tideData ? (
                    <div className="flex items-center gap-1.5">
                      {isTideRising !== null && (
                        <span className={`text-lg ${isTideRising ? 'text-green-400' : 'text-red-400'}`}>
                          {isTideRising ? '↑' : '↓'}
                        </span>
                      )}
                      <span className="font-semibold text-blue-500">
                        {tideData.height.toFixed(2)} m
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </td>
                
                {/* Wave Energy */}
                <td className="p-3">
                  {hour.waveEnergy ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-purple-500">
                        {formatWaveEnergy(hour.waveEnergy)}
                      </span>
                      {hour.swellPower && (
                        <span className="text-xs text-purple-400">
                          {formatSwellPower(hour.swellPower)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </td>
              </tr>
              
              {/* Tide event row (high/low) - AFTER the hourly row */}
              {tideEvent && (
                <tr key={`tide-${tideEvent.time}`} className={tideEvent.type === 'high' ? 'bg-blue-500/10 border-y border-blue-500/30' : 'bg-cyan-500/10 border-y border-cyan-500/30'}>
                  <td className="p-2 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${tideEvent.type === 'high' ? 'text-green-400' : 'text-red-400'}`}>
                        {tideEvent.type === 'high' ? '↑' : '↓'}
                      </span>
                      <span>{new Date(tideEvent.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td colSpan={2} className="p-2 text-sm text-muted-foreground">
                    {tideEvent.type === 'high' ? 'Marée haute' : 'Marée basse'}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-lg ${tideEvent.type === 'high' ? 'text-green-400' : 'text-red-400'}`}>
                        {tideEvent.type === 'high' ? '↑' : '↓'}
                      </span>
                      <span className="font-semibold text-blue-500">
                        {tideEvent.height.toFixed(2)} m
                      </span>
                    </div>
                  </td>
                  <td className="p-2 text-sm text-muted-foreground">
                    -
                  </td>
                </tr>
              )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
