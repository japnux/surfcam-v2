import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { SpotForm } from '../spot-form'

export const metadata: Metadata = {
  title: 'Nouveau spot - Administration',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function NewSpotPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await isAdmin())) {
    redirect('/')
  }

  return (
    <div className="container max-w-3xl py-8 space-y-8">
      <h1 className="text-4xl font-bold">Nouveau spot</h1>
      <SpotForm />
    </div>
  )
}
