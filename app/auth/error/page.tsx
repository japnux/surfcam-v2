import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Erreur de connexion',
  description: 'Une erreur est survenue lors de la connexion.',
}

export default function AuthErrorPage() {
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] py-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="p-3 bg-destructive/20 rounded-full">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Erreur de connexion</h1>
          <p className="text-muted-foreground">
            Le lien de connexion est invalide ou a expiré.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/auth/login">Réessayer</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
