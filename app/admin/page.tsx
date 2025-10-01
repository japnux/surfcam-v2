import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { getAllSpots } from '@/lib/data/spots'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Eye, TestTube } from 'lucide-react'

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

  const spots = await getAllSpots()

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Administration des spots</h1>
        <Button asChild>
          <Link href="/admin/spots/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau spot
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {spots.map((spot) => (
          <Card key={spot.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span>{spot.name}</span>
                  {!spot.is_active && (
                    <span className="text-xs px-2 py-1 bg-destructive/20 text-destructive rounded">
                      Inactif
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/spots/${spot.slug}`} target="_blank">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/spots/${spot.id}/test`}>
                      <TestTube className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/spots/${spot.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/spots/${spot.id}/delete`}>
                      <Trash2 className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Région:</span> {spot.region}
                </div>
                <div>
                  <span className="text-muted-foreground">Ville:</span> {spot.city || '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span> {spot.cam_type}
                </div>
                <div>
                  <span className="text-muted-foreground">Slug:</span> {spot.slug}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
