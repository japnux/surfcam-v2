import { TideData } from '@/lib/api/tides'
import { DailyData } from '@/lib/api/forecast'
import { getTidesForSpot } from '@/lib/data/tides'
import { ArrowUp, ArrowDown, Sunrise, Sunset, Droplets } from 'lucide-react'

interface TideInfoProps {
  spotId: string
  tides: TideData
  sunData?: DailyData
  tideCoefficient?: number | null
}

export async function TideInfo({ spotId, tides, sunData, tideCoefficient }: TideInfoProps) {
  // Get cached tide data from mareespeche.com
  const cachedTides = await getTidesForSpot(spotId);
  
  const now = new Date()
  
  // Use cached tides if available, otherwise fallback to API tides
  const tidesData = cachedTides?.tides || tides.events
  
  // Get next 2 tide events
  const nextTides = cachedTides?.tides 
    ? cachedTides.tides.filter(t => {
        const [hours, minutes] = t.time.split('h').map(Number)
        const tideTime = new Date()
        tideTime.setHours(hours, minutes, 0, 0)
        return tideTime > now
      }).slice(0, 2).map(t => ({
        time: (() => {
          const [hours, minutes] = t.time.split('h').map(Number)
          const date = new Date()
          date.setHours(hours, minutes, 0, 0)
          return date.toISOString()
        })(),
        type: t.type,
        height: 0 // Not used in display
      }))
    : tides.events.filter(e => new Date(e.time) > now).slice(0, 2)
  
  // Use coefficient from cached data if available
  const coefficient = cachedTides?.coefficient ? parseInt(cachedTides.coefficient) : tideCoefficient
  
  // Determine next sun event (sunrise or sunset)
  const nextSunEvent = (() => {
    if (!sunData) return null
    
    const sunrise = sunData.sunrise ? new Date(sunData.sunrise) : null
    const sunset = sunData.sunset ? new Date(sunData.sunset) : null
    
    if (!sunrise && !sunset) return null
    if (!sunrise) return { time: sunset!, type: 'sunset' as const }
    if (!sunset) return { time: sunrise, type: 'sunrise' as const }
    
    // Return the next one
    if (sunrise > now && sunrise < sunset) {
      return { time: sunrise, type: 'sunrise' as const }
    } else if (sunset > now) {
      return { time: sunset, type: 'sunset' as const }
    } else if (sunrise > now) {
      return { time: sunrise, type: 'sunrise' as const }
    }
    
    return null
  })()
  
  if (nextTides.length === 0 && !nextSunEvent) return null
  
  // Calculate tide coefficient from amplitude (French system: 20-120)

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Marées</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 items-center">
        {/* Tide 1 */}
        {nextTides[0] && (
          <div className="flex items-center gap-2">
            {nextTides[0].type === 'high' ? (
              <ArrowUp className="h-5 w-5 text-blue-500" />
            ) : (
              <ArrowDown className="h-5 w-5 text-blue-500" />
            )}
            <div>
              <div className="text-2xl font-bold">
                {new Date(nextTides[0].time).toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Tide Coefficient */}
        {coefficient && (
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-cyan-500" />
            <div>
              <div className="text-2xl font-bold">{coefficient}</div>
            </div>
          </div>
        )}

        {/* Tide 2 */}
        {nextTides[1] && (
          <div className="flex items-center gap-2">
            {nextTides[1].type === 'high' ? (
              <ArrowUp className="h-5 w-5 text-blue-500" />
            ) : (
              <ArrowDown className="h-5 w-5 text-blue-500" />
            )}
            <div>
              <div className="text-2xl font-bold">
                {new Date(nextTides[1].time).toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Sun event */}
        {nextSunEvent && (
          <div className="flex items-center gap-2 md:justify-self-end">
            {nextSunEvent.type === 'sunrise' ? (
              <Sunrise className="h-5 w-5 text-orange-500" />
            ) : (
              <Sunset className="h-5 w-5 text-orange-600" />
            )}
            <div>
              <div className="text-2xl font-bold">
                {nextSunEvent.time.toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
