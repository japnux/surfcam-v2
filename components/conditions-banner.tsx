import { HourlyForecast } from '@/lib/api/forecast'
import { TideEvent } from '@/lib/api/tides'
import {
  formatWaveHeight,
  formatWindSpeed,
  formatTemperature,
  formatPeriod,
  formatDirection,
  formatSwellPower,
  getWindDirectionArrow,
  getTidePhase,
} from '@/lib/utils'
import { Wind, Waves, Droplets, Thermometer, ArrowUp, ArrowDown, Zap } from 'lucide-react'

interface ConditionsBannerProps {
  current: HourlyForecast
  tideHeight: number
  tideCoefficient?: number | null
  nextTides?: TideEvent[]
}

export function ConditionsBanner({ current, tideHeight, tideCoefficient, nextTides }: ConditionsBannerProps) {
  const nextHigh = nextTides?.find(t => t.type === 'high')
  const nextLow = nextTides?.find(t => t.type === 'low')
  const tidePhase = getTidePhase(tideHeight, nextHigh?.height, nextLow?.height)
  
  // Determine next tide (closest one)
  const nextTide = (() => {
    if (!nextHigh && !nextLow) return null
    if (!nextHigh) return nextLow
    if (!nextLow) return nextHigh
    return new Date(nextHigh.time) < new Date(nextLow.time) ? nextHigh : nextLow
  })()

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Conditions actuelles</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Waves */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Waves className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-muted-foreground mb-1.5">VAGUES</div>
            <div className="text-3xl font-bold text-blue-500 mb-1 flex items-center gap-2">
              <span className="font-mono" style={{ fontVariantEmoji: 'text' }}>{getWindDirectionArrow(current.waveDirection)}</span>
              <span>{formatWaveHeight(current.waveHeight)} - {formatPeriod(current.wavePeriod)}</span>
            </div>
            <div className="space-y-0.5 text-sm">
              <div className="text-muted-foreground font-mono text-xs truncate">
                {formatDirection(current.waveDirection)}
              </div>
              {current.swellPower && current.swellPower > 0 && (
                <div className="flex items-center gap-1 text-xs text-blue-400 mt-1">
                  <Zap className="h-3 w-3" />
                  <span className="font-medium">{formatSwellPower(current.swellPower)}</span>
                </div>
              )}
            </div>
            {current.secondaryWaveHeight && current.secondaryWaveHeight > 0.3 && (
              <div className="mt-2 pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Houle 2:</span> {formatWaveHeight(current.secondaryWaveHeight)} · {formatPeriod(current.secondaryWavePeriod || 0)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Wind */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Wind className="h-6 w-6 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-muted-foreground mb-1.5">VENT</div>
            <div className="text-3xl font-bold text-green-500 mb-1 flex items-center gap-2">
              <span className="font-mono" style={{ fontVariantEmoji: 'text' }}>{getWindDirectionArrow(current.windDirection)}</span>
              <span>{formatWindSpeed(current.windSpeed)}</span>
            </div>
            <div className="space-y-0.5 text-sm">
              <div className="text-muted-foreground">
                <span className="font-medium">Raf:</span> {formatWindSpeed(current.windGust)}
              </div>
              <div className="text-muted-foreground font-mono text-xs truncate">
                {formatDirection(current.windDirection)}
              </div>
            </div>
          </div>
        </div>

        {/* Tide Coefficient */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Droplets className="h-6 w-6 text-cyan-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-muted-foreground mb-1.5">COEFF</div>
            <div className="text-3xl font-bold text-cyan-500 mb-1">
              {tideCoefficient || '-'}
            </div>
            <div className="space-y-0.5 text-sm">
              <div className="text-muted-foreground">
                <span className="font-medium">{tidePhase}</span>
              </div>
              {nextTide && (
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  {nextTide.type === 'high' ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  <span className="font-medium">
                    {nextTide.type === 'high' ? 'Haute' : 'Basse'}:
                  </span>
                  <span>
                    {new Date(nextTide.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Temperature */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Thermometer className="h-6 w-6 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-muted-foreground mb-1.5">TEMPÉRATURE</div>
            <div className="text-3xl font-bold text-orange-500 mb-1">
              {formatTemperature(current.waterTemp)}
            </div>
            <div className="space-y-0.5 text-sm">
              <div className="text-muted-foreground">
                <span className="font-medium">Eau</span>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium">Air:</span> {formatTemperature(current.airTemp)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
