import { useMemo, useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { cn } from '../../../utils/cn'
import FloatingInput from './FloatingInput'

function strengthScore(password) {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

const strengthMeta = [
  { label: '', color: 'bg-slate-200' },
  { label: 'Weak', color: 'bg-rose-500' },
  { label: 'Fair', color: 'bg-amber-500' },
  { label: 'Good', color: 'bg-sky-500' },
  { label: 'Strong', color: 'bg-emerald-500' },
]

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  helper,
  inputSize = 'default',
}) {
  const [visible, setVisible] = useState(false)
  const score = useMemo(() => strengthScore(value), [value])
  const meta = strengthMeta[score]

  return (
    <div>
      <div className="relative">
        <FloatingInput
          id={id}
          label={label}
          size={inputSize}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          error={error}
          helper={helper}
          icon={Lock}
          hasSuffix
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className={cn(
            'absolute z-10 text-slate-400 transition-colors hover:text-slate-600',
            inputSize === 'comfortable' ? 'right-4 top-7' : 'right-3 top-5',
          )}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {value && (
        <div className="mt-2 space-y-1.5">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  i <= score ? meta.color : 'bg-slate-200',
                )}
              />
            ))}
          </div>
          {meta.label && (
            <p className="text-xs font-medium text-slate-500">
              Password strength:{' '}
              <span className="text-slate-700">{meta.label}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
