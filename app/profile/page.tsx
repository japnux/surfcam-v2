import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/data/profiles'
import { ProfileForm } from './profile-form'
import { LogoutButton } from './logout-button'
import { User } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Mon profil',
  description: 'Gérez votre profil et vos préférences.',
}

export const revalidate = 0 // Always fresh

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const profile = await getOrCreateProfile(user.id, user.email || '')

  return (
    <div className="container max-w-2xl py-8 space-y-8">
      <div className="flex items-center gap-3">
        <User className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold">Mon profil</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-1">Email</h2>
          <p className="text-muted-foreground">{profile.email}</p>
        </div>

        <ProfileForm profile={profile} />

        <div className="pt-4 border-t border-border">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
