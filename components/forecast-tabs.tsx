'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ForecastTable } from './forecast-table'
import { HourlyForecast, DailyData } from '@/lib/api/forecast'
import { HourlyTide, TideEvent } from '@/lib/api/tides'
import { Clock, Calendar } from 'lucide-react'

interface ForecastTabsProps {
  hourly: HourlyForecast[]
  tideHourly?: HourlyTide[]
  tideEvents?: TideEvent[]
  daily?: DailyData[]
}

export function ForecastTabs({ hourly, tideHourly, tideEvents, daily }: ForecastTabsProps) {
  // Filter hourly data for extended view (every 3 hours)
  const extendedHourly = hourly.filter((_, index) => index % 3 === 0)
  
  return (
    <Tabs defaultValue="detailed" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="detailed" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">48h détaillé</span>
          <span className="sm:hidden">48h</span>
        </TabsTrigger>
        <TabsTrigger value="extended" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Vue étendue (7j)</span>
          <span className="sm:hidden">7 jours</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="detailed" className="mt-0">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Prévisions heure par heure pour les prochaines 48 heures
          </p>
          <ForecastTable
            hourly={hourly}
            tideHourly={tideHourly}
            tideEvents={tideEvents}
            daily={daily}
            hoursToShow={48}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="extended" className="mt-0">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Prévisions toutes les 3 heures sur 7 jours (vue condensée)
          </p>
          <ForecastTable
            hourly={extendedHourly}
            tideHourly={tideHourly}
            tideEvents={tideEvents}
            daily={daily}
            hoursToShow={56}
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}
