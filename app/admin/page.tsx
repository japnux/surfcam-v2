import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { getSpotsWithSources } from '@/lib/data/admin-spots'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { SpotsTable } from '@/components/admin/spots-table'
import { StormglassUsage } from '@/components/admin/stormglass-usage'

export const metadata: Metadata = {
  title: 'Administration',
  description: 'Gérer les spots de surf.',
  robots: {
    index: false,
    follow: false,
  },
}

export const revalidate = 0 // Always fresh

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await isAdmin())) {
    redirect('/')
  }

  const spots = await getSpotsWithSources()

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Administration des spots</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/stormglass-logs">
              Logs Stormglass
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/spots/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau spot
            </Link>
          </Button>
        </div>
      </div>

      {/* Stormglass Usage Stats */}
      <StormglassUsage />

      <SpotsTable spots={spots} />
    </div>
  )
}
