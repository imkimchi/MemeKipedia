'use client'

interface CategoryFilterProps {
  value: string
  onChange: (category: string) => void
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'DeFi', label: 'DeFi' },
  { value: 'NFT', label: 'NFT' },
  { value: 'Gaming', label: 'Gaming' },
  { value: 'Infrastructure', label: 'Infrastructure' },
  { value: 'Meme', label: 'Meme' },
  { value: 'Other', label: 'Other' },
]

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-10 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#a855f7]"
    >
      {CATEGORIES.map((cat) => (
        <option key={cat.value} value={cat.value}>
          {cat.label}
        </option>
      ))}
    </select>
  )
}
