import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { createServiceClient } from '@/lib/supabase/server'
import { SpotForm } from '../../spot-form'

export const metadata: Metadata = {
  title: 'Modifier le spot - Administration',
  robots: {
    index: false,
    follow: false,
  },
}

interface EditSpotPageProps {
  params: Promise<{ id: string }>
}

export default async function EditSpotPage({ params }: EditSpotPageProps) {
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

  return (
    <div className="container max-w-3xl py-8 space-y-8">
      <h1 className="text-4xl font-bold">Modifier le spot</h1>
      <SpotForm spot={spot} />
    </div>
  )
}
