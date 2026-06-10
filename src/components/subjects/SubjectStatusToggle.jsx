import { cn } from '../../utils/cn'

/** Active / Inactive toggle for Faculty Subject rows (persists as Active | In Active). */
export default function SubjectStatusToggle({ status, onChange, disabled = false }) {
  const active = status === 'Active'

  const handleToggle = () => {
    if (disabled) return
    const next = active ? 'In Active' : 'Active'
    onChange?.(next)
  }

  return (
    <div className="inline-flex items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={active ? 'Set inactive' : 'Set active'}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
          active ? 'bg-[#69df66]' : 'bg-[#efb36d]',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span
          className={cn(
            'pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            active ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
      <span className="whitespace-nowrap text-sm font-semibold text-[#333]">
        {active ? 'Active' : 'Inactive'}
      </span>
    </div>
  )
}
