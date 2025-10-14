import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { getStormglassLogs, getStormglassLogsStats } from '@/lib/api/stormglass-logger'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { StormglassLogsTable } from '@/components/admin/stormglass-logs-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Logs Stormglass - Administration',
  description: 'Historique des appels à l\'API Stormglass',
  robots: {
    index: false,
    follow: false,
  },
}

export const revalidate = 0 // Always fresh

export default async function StormglassLogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await isAdmin())) {
    redirect('/')
  }

  const logs = await getStormglassLogs(100)
  const stats = await getStormglassLogsStats()

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-4xl font-bold">Logs Stormglass</h1>
          </div>
          <p className="text-muted-foreground">
            Historique des appels à l'API Stormglass
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today.total}</div>
            <p className="text-xs text-muted-foreground">
              Appels effectués
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Succès
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.today.success}</div>
            <p className="text-xs text-muted-foreground">
              Appels réussis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Erreurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.today.error}</div>
            <p className="text-xs text-muted-foreground">
              Appels échoués
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Quota dépassé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.today.quota_exceeded}</div>
            <p className="text-xs text-muted-foreground">
              Limite atteinte
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <StormglassLogsTable logs={logs} />
    </div>
  )
}
