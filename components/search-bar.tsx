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
  const router = useRouter()

  useEffect(() => {
    const debouncedSearch = debounce((searchQuery: string) => {
      if (onSearch) {
        onSearch(searchQuery)
      } else {
        // Navigate to search page
        if (searchQuery) {
          router.push(`/spots?q=${encodeURIComponent(searchQuery)}`)
        } else {
          router.push('/spots')
        }
      }
    }, 300)

    if (query !== initialValue) {
      debouncedSearch(query)
    }
  }, [query, onSearch, router, initialValue])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10"
        aria-label="Rechercher des spots de surf"
      />
    </div>
  )
}
