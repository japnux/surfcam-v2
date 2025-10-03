import Link from 'next/link'
import { Waves, Heart, User, Shield, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { config } from '@/lib/config'
import { MobileNav } from './mobile-nav'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = user ? await isAdmin() : false

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 md:gap-6">
          <MobileNav user={user} />
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Waves className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline">{config.siteName}</span>
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link href="/spots" className="text-sm font-medium hover:text-primary transition-colors">
              Spots
            </Link>
            <Link href="/villes" className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors">
              <MapPin className="h-5 w-5" />
              <span className="hidden sm:inline">Voir par villes</span>
            </Link>
            {user && (
              <Link href="/favorites" className="text-sm font-medium hover:text-primary transition-colors">
                Favoris
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/favorites" aria-label="Mes favoris">
                  <Heart className="h-5 w-5" />
                </Link>
              </Button>
              {admin && (
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/admin" aria-label="Administration">
                    <Shield className="h-5 w-5" />
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" asChild>
                <Link href="/profile" aria-label="Mon profil">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            </>
          ) : (
            <Button asChild>
              <Link href="/auth/login">Connexion</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
