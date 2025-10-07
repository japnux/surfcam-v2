import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { createServiceClient } from '@/lib/supabase/server'
import { DeleteSpotForm } from './delete-form'

export const metadata: Metadata = {
  title: 'Supprimer le spot - Administration',
  robots: {
    index: false,
    follow: false,
  },
}

interface DeleteSpotPageProps {
  params: Promise<{ id: string }>
}

export default async function DeleteSpotPage({ params }: DeleteSpotPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await isAdmin())) {
    redirect('/')
  }

  const { id } = await params
  const serviceClient = await createServiceClient()
  
  const { data: spot, error } = await serviceClient
    .from('spots')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !spot) {
    notFound()
  }
  
  // Type assertion for spot data
  const spotData = spot as any

  return (
    <div className="container max-w-2xl py-8 space-y-8">
      <h1 className="text-4xl font-bold">Supprimer le spot</h1>
      
      <div className="bg-destructive/10 border border-destructive rounded-lg p-6 space-y-4">
        <p className="font-semibold">
          Êtes-vous sûr de vouloir supprimer ce spot ?
        </p>
        <div className="space-y-2 text-sm">
          <p><strong>Nom:</strong> {spotData.name}</p>
          <p><strong>Slug:</strong> {spotData.slug}</p>
          <p><strong>Région:</strong> {spotData.region}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Cette action est irréversible. Tous les favoris associés seront également supprimés.
        </p>
      </div>

      <DeleteSpotForm spotId={id} spotName={spotData.name} />
    </div>
  )
}
