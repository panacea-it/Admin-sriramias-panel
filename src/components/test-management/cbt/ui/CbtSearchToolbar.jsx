import { Search } from 'lucide-react'
import { cn } from '../../../../utils/cn'
import { CBT_SEARCH_INPUT_CLASS, CBT_TOOLBAR_CLASS } from './cbtUiConstants'

export default function CbtSearchToolbar({
  value,
  onChange,
  placeholder = 'Search…',
  disabled = false,
  align = 'start',
  compact = false,
  className,
  inputClassName,
  children,
}) {
  const isEnd = align === 'end'

  if (compact) {
    return (
      <div className={cn('relative w-full', className)}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687180]" />
        <input
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(CBT_SEARCH_INPUT_CLASS, 'shadow-sm', inputClassName)}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        CBT_TOOLBAR_CLASS,
        isEnd ? 'justify-end' : 'justify-between',
        className,
      )}
    >
      <div
        className={cn(
          'relative w-full min-w-0',
          isEnd ? 'sm:max-w-md sm:ml-auto' : 'flex-1 sm:max-w-md',
        )}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180] sm:left-4" />
        <input
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(CBT_SEARCH_INPUT_CLASS, inputClassName)}
        />
      </div>
      {children}
    </div>
  )
}
