import { cn } from '../../../utils/cn'

export default function EmiToggleSwitch({ checked, onChange, id, label = 'Enable EMI Plan' }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#55ace7]/20 bg-gradient-to-r from-[#eef6fc] to-white px-4 py-3 shadow-sm">
      <div>
        <p className="text-sm font-bold text-[#246392]">{label}</p>
        <p className="text-xs text-[#686868]">
          {checked ? 'Configure installments and track EMI schedule' : 'Standard one-time offline payment'}
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onChange(!checked)
        }}
        className={cn(
          'relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-[#246392]' : 'bg-slate-300',
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200',
            checked && 'translate-x-6',
          )}
        />
      </button>
    </div>
  )
}
