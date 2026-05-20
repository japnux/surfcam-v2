'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
  initialValue?: string
}

/**
 * Champ de recherche : la recherche ne se déclenche qu'à la validation
 * du champ (touche Entrée / soumission du formulaire), pas à la frappe.
 */
export function SearchBar({
  onSearch,
  placeholder = 'Rechercher un spot...',
  initialValue = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q.length < 2) return

    if (onSearch) {
      onSearch(q)
    } else {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10"
        aria-label="Rechercher des spots de surf ou des villes"
      />
    </form>
  )
}
