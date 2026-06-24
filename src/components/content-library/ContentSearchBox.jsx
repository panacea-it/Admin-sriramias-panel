import { useEffect, useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { searchContent } from '../../api/contentLibraryAPI'
import { motion, AnimatePresence } from 'framer-motion'

export default function ContentSearchBox({ onSelect }) {
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions([])
      return undefined
    }
    const t = setTimeout(() => {
      setSuggestions(searchContent(q, 8))
      setOpen(true)
    }, 200)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => q.length >= 2 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Instant search — titles, tags, keywords"
        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm shadow-sm focus:border-[#55ace7] focus:outline-none focus:ring-2 focus:ring-[#55ace7]/25"
      />
      <Sparkles className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#55ace7]" aria-hidden />
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full flex-col px-4 py-2 text-left text-sm hover:bg-slate-50"
                  onMouseDown={() => {
                    onSelect?.(item)
                    setQ(item.title)
                    setOpen(false)
                  }}
                >
                  <span className="font-medium text-[#1a3a5c]">{item.title}</span>
                  <span className="text-xs text-slate-500">{item.contentType} · {item.status}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
