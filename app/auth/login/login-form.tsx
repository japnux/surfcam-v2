'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Mail } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error('Failed to send magic link')
      }

      setSent(true)
      toast({
        title: 'Email envoyé !',
        description: 'Vérifiez votre boîte de réception pour vous connecter.',
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible d'envoyer l'email. Veuillez réessayer.",
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-primary/20 rounded-full">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Vérifiez votre email</h2>
          <p className="text-muted-foreground">
            Nous avons envoyé un lien de connexion à <strong>{email}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Cliquez sur le lien dans l&apos;email pour vous connecter.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Adresse email</Label>
        <Input
          id="email"
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Envoi en cours...' : 'Envoyer le lien de connexion'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        En vous connectant, vous acceptez nos conditions d&apos;utilisation
      </p>
    </form>
  )
}
