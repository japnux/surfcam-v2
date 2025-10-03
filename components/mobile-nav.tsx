'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, Waves, MapPin, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { config } from '@/lib/config'
import type { User } from '@supabase/supabase-js'

interface MobileNavProps {
  user: User | null
}

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg" onClick={() => setOpen(false)}>
            <Waves className="h-6 w-6 text-primary" />
            <span>{config.siteName}</span>
          </Link>
          <nav className="flex flex-col gap-2">
            <Link href="/spots" className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors" onClick={() => setOpen(false)}>
              <Waves className="h-5 w-5" />
              Spots
            </Link>
            <Link href="/villes" className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors" onClick={() => setOpen(false)}>
              <MapPin className="h-5 w-5" />
              Villes
            </Link>
            {user && (
              <Link href="/favorites" className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors" onClick={() => setOpen(false)}>
                <Heart className="h-5 w-5" />
                Favoris
              </Link>
            )}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
