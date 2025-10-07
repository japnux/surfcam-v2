import { Suspense } from 'react'
import { ForecastTable } from './forecast-table'
import { HourlyForecast, DailyData } from '@/lib/api/forecast'
import { HourlyTide, TideEvent } from '@/lib/api/tides'

interface ForecastTableAsyncProps {
  hourly: HourlyForecast[]
  tideHourly?: HourlyTide[]
  tideEvents?: TideEvent[]
  daily?: DailyData[]
  hoursToShow?: number
}

function TableSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-full"></div>
        <div className="h-8 bg-muted rounded w-full"></div>
        <div className="h-8 bg-muted rounded w-full"></div>
        <div className="h-8 bg-muted rounded w-full"></div>
        <div className="h-8 bg-muted rounded w-full"></div>
        <div className="h-8 bg-muted rounded w-full"></div>
        <div className="h-8 bg-muted rounded w-full"></div>
        <div className="h-8 bg-muted rounded w-full"></div>
      </div>
    </div>
  )
}

export function ForecastTableAsync(props: ForecastTableAsyncProps) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ForecastTable {...props} />
    </Suspense>
  )
}
