import { cn } from '../../../utils/cn'

export default function PaymentTypeToggle({ value, onChange }) {
  const options = [
    { id: 'full', label: 'Full Payment' },
    { id: 'emi', label: 'EMI Payment' },
  ]

  return (
    <div className="inline-flex w-full rounded-xl bg-slate-100 p-1 sm:w-auto">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            'flex-1 rounded-lg px-5 py-2.5 text-sm font-bold transition-all sm:flex-none sm:px-8',
            value === opt.id
              ? 'bg-white text-[#246392] shadow-md ring-1 ring-[#55ace7]/20'
              : 'text-[#686868] hover:text-[#246392]',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
