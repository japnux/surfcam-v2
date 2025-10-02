'use client'

import { TideData, TideEvent } from '@/lib/api/tides'
import { DailyData } from '@/lib/api/forecast'
import { ArrowUp, ArrowDown, Sunrise, Sunset } from 'lucide-react'

interface TideChartProps {
  tides: TideData
  sunData?: DailyData
  hours?: number
}

export function TideChart({ tides, sunData, hours = 12 }: TideChartProps) {
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
  
  // Calculate time range for normalization - use actual first data point time
  const startTime = new Date(hourlyData[0].time).getTime()
  const endTimeMs = new Date(hourlyData[hourlyData.length - 1].time).getTime()
  const timeRange = endTimeMs - startTime
  
  // Calculate min and max for scaling
  const heights = hourlyData.map(h => h.height)
  const minHeight = Math.min(...heights)
  const maxHeight = Math.max(...heights)
  const heightRange = maxHeight - minHeight || 1
  
  // Create SVG path for the tide curve
  const svgWidth = 100 // Use percentage-based width
  const svgHeight = 80
  const padding = 1 // Proportional padding
  
  const points = hourlyData.map((h, i) => {
    // Calculate x position normalized to 0-100 range
    const pointTime = new Date(h.time)
    const timeFromStart = pointTime.getTime() - startTime
    const x = (timeFromStart / timeRange) * svgWidth
    
    // Normalize: 0 = min height, 1 = max height
    const normalizedHeight = (h.height - minHeight) / heightRange
    // INVERSE: high tide (1) → large y (bottom visually = top after transform), low tide (0) → small y
    const y = padding + (normalizedHeight * (svgHeight - 2 * padding))
    return { x, y, time: pointTime, height: h.height }
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
          preserveAspectRatio="none"
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
          
          {/* Sun vertical lines */}
          {sunData?.sunrise && (() => {
            const sunriseTime = new Date(sunData.sunrise)
            const timeFromStart = sunriseTime.getTime() - startTime
            const positionRatio = timeFromStart / timeRange
            
            if (positionRatio >= 0 && positionRatio <= 1) {
              const x = positionRatio * svgWidth
              return (
                <line
                  key="sunrise-line"
                  x1={x}
                  y1={padding}
                  x2={x}
                  y2={svgHeight - padding}
                  stroke="rgb(249, 115, 22, 0.4)"
                  strokeWidth="1.5"
                  strokeDasharray="4,3"
                />
              )
            }
            return null
          })()}
          
          {sunData?.sunset && (() => {
            const sunsetTime = new Date(sunData.sunset)
            const timeFromStart = sunsetTime.getTime() - startTime
            const positionRatio = timeFromStart / timeRange
            
            if (positionRatio >= 0 && positionRatio <= 1) {
              const x = positionRatio * svgWidth
              return (
                <line
                  key="sunset-line"
                  x1={x}
                  y1={padding}
                  x2={x}
                  y2={svgHeight - padding}
                  stroke="rgb(234, 88, 12, 0.4)"
                  strokeWidth="1.5"
                  strokeDasharray="4,3"
                />
              )
            }
            return null
          })()}
        </svg>
        
        {/* Tide Events (High/Low markers) and Sun times */}
        <div className="relative w-full" style={{ height: '50px', marginTop: '10px' }}>
          {/* Tide events */}
          {events.map((event, index) => {
            const eventTime = new Date(event.time)
            const timeFromStart = eventTime.getTime() - startTime
            const positionPercent = (timeFromStart / timeRange) * 100
            
            if (positionPercent < 0 || positionPercent > 100) return null
            
            return (
              <div
                key={`${event.time}-${index}`}
                className="absolute"
                style={{ 
                  left: `${positionPercent}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="flex flex-col items-center justify-center">
                  {event.type === 'high' ? (
                    <ArrowUp className="h-4 w-4 text-blue-500 mx-auto" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-blue-500 mx-auto" />
                  )}
                  <div className="text-xs font-semibold text-center mt-1 whitespace-nowrap">
                    {eventTime.toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground text-center whitespace-nowrap">
                    {event.height.toFixed(1)}m
                  </div>
                </div>
              </div>
            )
          })}
          
          {/* Sunrise marker */}
          {sunData?.sunrise && (() => {
            const sunriseTime = new Date(sunData.sunrise)
            const timeFromStart = sunriseTime.getTime() - startTime
            const positionPercent = (timeFromStart / timeRange) * 100
            
            if (positionPercent >= 0 && positionPercent <= 100) {
              return (
                <div
                  key="sunrise"
                  className="absolute"
                  style={{ 
                    left: `${positionPercent}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="flex flex-col items-center">
                    <Sunrise className="h-4 w-4 text-orange-500" />
                    <div className="text-xs font-semibold text-center mt-1 text-orange-500 whitespace-nowrap">
                      {sunriseTime.toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              )
            }
            return null
          })()}
          
          {/* Sunset marker */}
          {sunData?.sunset && (() => {
            const sunsetTime = new Date(sunData.sunset)
            const timeFromStart = sunsetTime.getTime() - startTime
            const positionPercent = (timeFromStart / timeRange) * 100
            
            if (positionPercent >= 0 && positionPercent <= 100) {
              return (
                <div
                  key="sunset"
                  className="absolute"
                  style={{ 
                    left: `${positionPercent}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="flex flex-col items-center">
                    <Sunset className="h-4 w-4 text-orange-600" />
                    <div className="text-xs font-semibold text-center mt-1 text-orange-600 whitespace-nowrap">
                      {sunsetTime.toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              )
            }
            return null
          })()}
        </div>
      </div>
    </div>
  )
}
