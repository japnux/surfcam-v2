import { HourlyForecast } from '@/lib/api/forecast'
import {
  formatWaveHeight,
  formatWindSpeed,
  formatTemperature,
  formatPeriod,
  formatSwellPower,
  getWindDirectionArrow,
} from '@/lib/utils'

interface ForecastTableProps {
  hourly: HourlyForecast[]
  hoursToShow?: number
}

export function ForecastTable({ hourly, hoursToShow = 48 }: ForecastTableProps) {
  // Obtenir l'heure courante arrondie à l'heure inférieure
  const now = new Date()
  now.setMinutes(0, 0, 0) // Arrondir à l'heure inférieure
  
  // Filtrer les prévisions pour ne garder que celles >= à l'heure courante
  const futureForecasts = hourly.filter(hour => new Date(hour.time) >= now)
  const displayData = futureForecasts.slice(0, hoursToShow)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-secondary z-10">
          <tr className="border-b border-border">
            <th className="p-3 text-left font-semibold">Heure</th>
            <th className="p-3 text-left font-semibold">Vent</th>
            <th className="p-3 text-left font-semibold">Vagues</th>
            <th className="p-3 text-left font-semibold">Eau</th>
            <th className="p-3 text-left font-semibold">Air</th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((hour, index) => {
            const date = new Date(hour.time)
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

            return (
              <>
                {isNewDay && (
                  <tr className="bg-primary/10 border-t-2 border-t-primary/40">
                    <td colSpan={5} className="p-2 text-sm font-semibold text-primary">
                      {fullDateStr.charAt(0).toUpperCase() + fullDateStr.slice(1)}
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
                
                <td className="p-3">{formatTemperature(hour.waterTemp)}</td>
                <td className="p-3">{formatTemperature(hour.airTemp)}</td>
              </tr>
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
