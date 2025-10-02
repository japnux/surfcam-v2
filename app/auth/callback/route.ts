import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/data/profiles'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const next = searchParams.get('next') || '/'
  const supabase = await createClient()

  // Handle PKCE flow (new format with token_hash)
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error && data.user) {
      try {
        await getOrCreateProfile(data.user.id, data.user.email || '')
      } catch (err) {
        console.error('Failed to create profile:', err)
      }
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  // Handle legacy magic link flow (old format with token)
  if (token && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type: type === 'magiclink' ? 'email' : (type as any),
      token,
    })

    if (!error && data.user) {
      try {
        await getOrCreateProfile(data.user.id, data.user.email || '')
      } catch (err) {
        console.error('Failed to create profile:', err)
      }
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  // Handle code exchange (OAuth/PKCE)
  const code = searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        try {
          await getOrCreateProfile(user.id, user.email || '')
        } catch (err) {
          console.error('Failed to create profile:', err)
        }
        return NextResponse.redirect(new URL(next, origin))
      }
    }
  }

  // Redirect to error page if verification failed
  return NextResponse.redirect(new URL('/auth/error', origin))
}
