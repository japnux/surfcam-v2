import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/data/profiles'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') || '/'

  if (token_hash && type) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error && data.user) {
      // Create or update profile
      try {
        await getOrCreateProfile(data.user.id, data.user.email || '')
      } catch (err) {
        console.error('Failed to create profile:', err)
      }

      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Redirect to error page if verification failed
  return NextResponse.redirect(new URL('/auth/error', request.url))
}
