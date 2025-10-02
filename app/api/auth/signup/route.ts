import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/data/profiles'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Pas de confirmation email nécessaire
      },
    })

    if (error) {
      console.error('Signup error:', error)
      return NextResponse.json(
        { error: error.message || 'Erreur lors de la création du compte' },
        { status: 400 }
      )
    }

    // Create profile
    if (data.user) {
      try {
        await getOrCreateProfile(data.user.id, data.user.email || '')
      } catch (err) {
        console.error('Failed to create profile:', err)
      }
    }

    return NextResponse.json({ 
      success: true,
      user: data.user 
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
