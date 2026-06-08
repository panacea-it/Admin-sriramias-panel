import { ChevronRight, Home } from 'lucide-react'
import { cn } from '../../../utils/cn'

export default function CbtBreadcrumbBar({ path = [], onNavigate }) {
  if (!path.length) {
    return (
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Home className="h-4 w-4" />
        <span>Select a test series from the explorer</span>
      </nav>
    )
  }

  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm">
      <button
        type="button"
        onClick={() => onNavigate?.(null)}
        className="flex items-center gap-1 rounded px-1 py-0.5 text-slate-500 hover:bg-slate-100 hover:text-[#55ace7]"
      >
        <Home className="h-4 w-4" />
      </button>
      {path.map((node, idx) => (
        <span key={node.id} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
          <button
            type="button"
            onClick={() => onNavigate?.(node.id)}
            className={cn(
              'max-w-[200px] truncate rounded px-1.5 py-0.5 font-medium transition',
              idx === path.length - 1
                ? 'bg-[#1a3a5c]/10 text-[#1a3a5c]'
                : 'text-slate-600 hover:bg-slate-100 hover:text-[#55ace7]',
            )}
          >
            {node.title}
          </button>
        </span>
      ))}
    </nav>
  )
}
