import { TideData, TideEvent } from '@/lib/api/tides'
import { ArrowUp, ArrowDown } from 'lucide-react'

interface TideChartProps {
  tides: TideData
  hours?: number
}

export function TideChart({ tides, hours = 12 }: TideChartProps) {
  const now = new Date()
  const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000)
  
  // Filter hourly data for the specified time range
  const hourlyData = tides.hourly
    .filter(h => {
      const time = new Date(h.time)
      return time >= now && time <= endTime
    })
    .slice(0, hours)
  
  // Filter tide events (high/low) for the specified time range
  const events = tides.events
    .filter(e => {
      const time = new Date(e.time)
      return time >= now && time <= endTime
    })
  
  if (hourlyData.length === 0) return null
  
  // Calculate min and max for scaling
  const heights = hourlyData.map(h => h.height)
  const minHeight = Math.min(...heights)
  const maxHeight = Math.max(...heights)
  const heightRange = maxHeight - minHeight || 1
  
  // Create SVG path for the tide curve
  const svgWidth = 1000
  const svgHeight = 80
  const padding = 10
  
  const points = hourlyData.map((h, i) => {
    const x = (i / (hourlyData.length - 1)) * svgWidth
    // Normalize: 0 = min height, 1 = max height
    const normalizedHeight = (h.height - minHeight) / heightRange
    // Invert for SVG: high tide (1) → small y (top), low tide (0) → large y (bottom)
    const y = svgHeight - padding - (normalizedHeight * (svgHeight - 2 * padding))
    return { x, y, time: new Date(h.time), height: h.height }
  })
  
  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`)
    .join(' ')

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Marées</h2>
      
      <div className="relative w-full" style={{ height: `${svgHeight + 60}px` }}>
        {/* SVG Tide Curve */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full"
          style={{ height: `${svgHeight}px` }}
        >
          {/* Background fill */}
          <path
            d={`${pathData} L ${svgWidth},${svgHeight} L 0,${svgHeight} Z`}
            fill="rgb(59, 130, 246, 0.1)"
          />
          
          {/* Tide curve */}
          <path
            d={pathData}
            fill="none"
            stroke="rgb(59, 130, 246)"
            strokeWidth="2"
          />
          
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              y1={padding + ratio * (svgHeight - 2 * padding)}
              x2={svgWidth}
              y2={padding + ratio * (svgHeight - 2 * padding)}
              stroke="rgb(100, 116, 139, 0.2)"
              strokeWidth="1"
            />
          ))}
        </svg>
        
        {/* Tide Events (High/Low markers) */}
        <div className="relative w-full" style={{ height: '50px', marginTop: '10px' }}>
          {events.map((event, index) => {
            const eventTime = new Date(event.time)
            const hoursFromNow = (eventTime.getTime() - now.getTime()) / (1000 * 60 * 60)
            const positionPercent = (hoursFromNow / hours) * 100
            
            if (positionPercent < 0 || positionPercent > 100) return null
            
            return (
              <div
                key={`${event.time}-${index}`}
                className="absolute transform -translate-x-1/2"
                style={{ left: `${positionPercent}%` }}
              >
                <div className="flex flex-col items-center">
                  {event.type === 'high' ? (
                    <ArrowUp className="h-4 w-4 text-blue-500" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-blue-500" />
                  )}
                  <div className="text-xs font-semibold text-center mt-1">
                    {eventTime.toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {event.height.toFixed(1)}m
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
