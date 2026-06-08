import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

export function SectionTitle({ children }) {
  return (
    <div className="rounded-xl bg-white px-4 py-3 text-center shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
      <h3 className="text-base font-bold text-[#246392] sm:text-lg">{children}</h3>
    </div>
  )
}

export function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[#333]">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  )
}

export function FormInput({ register, name, error, ...props }) {
  return (
    <input
      {...register(name)}
      className={cn(
        'h-11 w-full rounded-xl bg-[#d1e9f6] px-4 text-sm text-[#222] outline-none placeholder:text-[#7a8a9a] focus:ring-2 focus:ring-[#55ace7]/40',
        error && 'ring-2 ring-red-400',
      )}
      {...props}
    />
  )
}

export function FormTextarea({ register, name, error, rows = 3, ...props }) {
  return (
    <textarea
      {...register(name)}
      rows={rows}
      className={cn(
        'w-full rounded-xl bg-[#d1e9f6] px-4 py-2.5 text-sm text-[#222] outline-none placeholder:text-[#7a8a9a] focus:ring-2 focus:ring-[#55ace7]/40',
        error && 'ring-2 ring-red-400',
      )}
      {...props}
    />
  )
}

export function FormSelect({
  register,
  name,
  error,
  options,
  placeholder,
  disabled = false,
  onChange,
}) {
  const registration = register(name)
  return (
    <div className="relative">
      <select
        {...registration}
        disabled={disabled}
        onChange={(e) => {
          registration.onChange(e)
          onChange?.(e)
        }}
        className={cn(
          'h-11 w-full appearance-none rounded-xl bg-[#d1e9f6] px-4 pr-10 text-sm text-[#222] outline-none focus:ring-2 focus:ring-[#55ace7]/40',
          disabled && 'cursor-not-allowed opacity-60',
          error && 'ring-2 ring-red-400',
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687180]" />
    </div>
  )
}

export function RecurringToggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-[#55ace7]' : 'bg-[#d1d5db]'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
      <span className="text-sm font-medium text-[#222]">{label}</span>
    </label>
  )
}

export function FormFooter({ saving, onReset }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200/80 bg-[#f4f6f8]/95 px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onReset}
          disabled={saving}
          className="h-11 min-w-[140px] rounded-xl bg-gradient-to-r from-[#7eb8e8] to-[#55ace7] px-8 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(85,172,231,0.35)] transition hover:opacity-90 disabled:opacity-60"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={saving}
          className="h-11 min-w-[140px] rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-8 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
