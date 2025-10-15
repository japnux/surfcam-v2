'use client'

import { useState } from 'react'
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
  const [activeTab, setActiveTab] = useState('detailed')
  const [hasLoadedExtended, setHasLoadedExtended] = useState(false)
  
  // Filter hourly data for extended view (every 3 hours) - only when needed
  const extendedHourly = activeTab === 'extended' ? hourly.filter((_, index) => index % 3 === 0) : []
  
  // Mark extended as loaded when tab is activated
  if (activeTab === 'extended' && !hasLoadedExtended) {
    setHasLoadedExtended(true)
  }
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
          {hasLoadedExtended ? (
            <ForecastTable
              hourly={extendedHourly}
              tideHourly={tideHourly}
              tideEvents={tideEvents}
              daily={daily}
              hoursToShow={56}
            />
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-full"></div>
                <div className="h-8 bg-muted rounded w-full"></div>
                <div className="h-8 bg-muted rounded w-full"></div>
                <div className="h-8 bg-muted rounded w-full"></div>
                <div className="h-8 bg-muted rounded w-full"></div>
              </div>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
