'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export function SearchBar({ onSearch, placeholder = 'Search wikis...' }: SearchBarProps) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query)
    }, 250)

    return () => clearTimeout(timer)
  }, [query, onSearch])

  return (
    <Input
      type="text"
      placeholder={placeholder}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className="w-full"
    />
  )
}
