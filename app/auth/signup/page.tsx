import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignupForm } from './signup-form'

export const metadata: Metadata = {
  title: 'Créer un compte',
  description: 'Créez votre compte pour sauvegarder vos spots favoris.',
}

export default async function SignupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If already logged in, redirect to home
  if (user) {
    redirect('/')
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Créer un compte</h1>
          <p className="text-muted-foreground">
            Rejoignez No Bueno Webcams pour suivre vos spots préférés
          </p>
        </div>
        
        <SignupForm />
      </div>
    </div>
  )
}
