import { HourlyForecast } from '@/lib/api/forecast'
import { TideEvent } from '@/lib/api/tides'
import {
  formatWaveHeight,
  formatWindSpeed,
  formatTemperature,
  formatPeriod,
  getWindDirectionArrow,
  getSwellDirectionArrow,
  getTidePhase,
} from '@/lib/utils'
import { Wind, Waves, Droplets, Thermometer } from 'lucide-react'

interface ConditionsBannerProps {
  current: HourlyForecast
  tideHeight: number
  nextTides?: TideEvent[]
}

export function ConditionsBanner({ current, tideHeight, nextTides }: ConditionsBannerProps) {
  const nextHigh = nextTides?.find(t => t.type === 'high')
  const nextLow = nextTides?.find(t => t.type === 'low')
  const tidePhase = getTidePhase(tideHeight, nextHigh?.height, nextLow?.height)

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Conditions actuelles</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Wind */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Wind className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Vent</div>
            <div className="text-2xl font-bold">
              {formatWindSpeed(current.windSpeed)}
            </div>
            <div className="text-sm text-muted-foreground">
              Rafales: {formatWindSpeed(current.windGust)}
            </div>
            <div className="text-lg mt-1">{getWindDirectionArrow(current.windDirection)}</div>
          </div>
        </div>

        {/* Waves */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Waves className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Vagues</div>
            <div className="text-2xl font-bold text-primary">
              {formatWaveHeight(current.waveHeight)}
            </div>
            <div className="text-sm text-muted-foreground">
              Période: {formatPeriod(current.wavePeriod)}
            </div>
            <div className="text-lg mt-1">{getSwellDirectionArrow(current.waveDirection)}</div>
            {current.secondaryWaveHeight && (
              <div className="text-xs text-muted-foreground mt-1">
                Houle 2: {formatWaveHeight(current.secondaryWaveHeight)} / {formatPeriod(current.secondaryWavePeriod || 0)}
              </div>
            )}
          </div>
        </div>

        {/* Tide */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Droplets className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Marée</div>
            <div className="text-2xl font-bold">
              {tideHeight.toFixed(1)}m
            </div>
            <div className="text-sm text-muted-foreground">
              {tidePhase}
            </div>
            {nextHigh && (
              <div className="text-xs text-muted-foreground mt-1">
                Prochaine haute: {new Date(nextHigh.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>

        {/* Temperature */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Thermometer className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Température</div>
            <div className="text-2xl font-bold">
              {formatTemperature(current.waterTemp)}
            </div>
            <div className="text-sm text-muted-foreground">
              Eau
            </div>
            <div className="text-sm mt-1">
              Air: {formatTemperature(current.airTemp)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
