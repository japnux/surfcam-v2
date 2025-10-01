import { HourlyForecast } from '@/lib/api/forecast'
import {
  formatWaveHeight,
  formatWindSpeed,
  formatTemperature,
  formatPeriod,
  getWindDirectionArrow,
  getSwellDirectionArrow,
} from '@/lib/utils'

interface ForecastTableProps {
  hourly: HourlyForecast[]
  hourlyTides?: Array<{ time: string; height: number }>
  hoursToShow?: number
}

export function ForecastTable({ hourly, hourlyTides, hoursToShow = 48 }: ForecastTableProps) {
  const displayData = hourly.slice(0, hoursToShow)

  const getTideHeight = (time: string) => {
    if (!hourlyTides) return null
    const tide = hourlyTides.find(t => t.time === time)
    return tide ? tide.height.toFixed(1) : null
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-secondary z-10">
          <tr className="border-b border-border">
            <th className="p-3 text-left font-semibold">Heure</th>
            <th className="p-3 text-left font-semibold">Vent</th>
            <th className="p-3 text-left font-semibold">Rafales</th>
            <th className="p-3 text-left font-semibold">Direction</th>
            <th className="p-3 text-left font-semibold">Vagues 1</th>
            <th className="p-3 text-left font-semibold">Période</th>
            <th className="p-3 text-left font-semibold">Dir.</th>
            <th className="p-3 text-left font-semibold">Vagues 2</th>
            <th className="p-3 text-left font-semibold">Marée</th>
            <th className="p-3 text-left font-semibold">Eau</th>
            <th className="p-3 text-left font-semibold">Air</th>
            <th className="p-3 text-left font-semibold">Pluie</th>
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
            const tideHeight = getTideHeight(hour.time)

            return (
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
                <td className="p-3">{formatWindSpeed(hour.windSpeed)}</td>
                <td className="p-3">{formatWindSpeed(hour.windGust)}</td>
                <td className="p-3 text-lg">{getWindDirectionArrow(hour.windDirection)}</td>
                <td className="p-3 font-semibold text-primary">
                  {formatWaveHeight(hour.waveHeight)}
                </td>
                <td className="p-3">{formatPeriod(hour.wavePeriod)}</td>
                <td className="p-3 text-lg">{getSwellDirectionArrow(hour.waveDirection)}</td>
                <td className="p-3 text-muted-foreground">
                  {hour.secondaryWaveHeight
                    ? `${formatWaveHeight(hour.secondaryWaveHeight)} / ${formatPeriod(
                        hour.secondaryWavePeriod || 0
                      )}`
                    : '-'}
                </td>
                <td className="p-3">{tideHeight ? `${tideHeight}m` : '-'}</td>
                <td className="p-3">{formatTemperature(hour.waterTemp)}</td>
                <td className="p-3">{formatTemperature(hour.airTemp)}</td>
                <td className="p-3">{hour.precipitation > 0 ? `${hour.precipitation}mm` : '-'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
