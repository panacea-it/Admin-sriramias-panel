import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function CategoryBreadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const className = isLast
          ? 'font-semibold text-[#246392]'
          : 'font-medium text-[#686868] hover:text-[#246392]'

        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#9ca0a8]" aria-hidden />
            )}
            {item.path && !isLast ? (
              <Link to={item.path} className={`${className} underline-offset-2 hover:underline`}>
                {item.label}
              </Link>
            ) : (
              <span className={className}>{item.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
