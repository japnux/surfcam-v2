'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { debounce } from '@/lib/utils'

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
  initialValue?: string
}

export function SearchBar({ onSearch, placeholder = 'Rechercher un spot...', initialValue = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const debouncedSearch = debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        return
      }

      setIsSearching(true)

      try {
        if (onSearch) {
          onSearch(searchQuery)
        } else {
          // Rediriger vers la page de résultats unifiée
          router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
        }
      } catch (error) {
        console.error('Erreur lors de la recherche:', error)
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      } finally {
        setIsSearching(false)
      }
    }, 500)

    if (query !== initialValue && query.length >= 2) {
      debouncedSearch(query)
    }
  }, [query, onSearch, router, initialValue])

  return (
    <div className="relative">
      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isSearching ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
      <Input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10"
        aria-label="Rechercher des spots de surf ou des villes"
      />
    </div>
  )
}
