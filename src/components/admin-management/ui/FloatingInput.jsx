import { useState } from 'react'
import { cn } from '../../../utils/cn'

const sizeStyles = {
  default: {
    input:
      'rounded-xl px-3.5 pb-2.5 pt-5 text-sm peer-placeholder-shown:text-sm peer-focus:text-[11px]',
    labelBase: 'left-3.5',
    labelFloat: 'top-2 text-[11px]',
    labelCenter: 'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2',
    labelIcon: 'left-11 peer-focus:left-11',
    icon: 'left-3.5 h-4 w-4',
    iconPadding: 'pl-11',
    suffixPadding: 'pr-11',
  },
  comfortable: {
    input:
      'min-h-[3.25rem] rounded-xl px-4 pb-3 pt-[1.35rem] text-[15px] leading-snug peer-placeholder-shown:text-[15px] peer-focus:text-xs',
    labelBase: 'left-4',
    labelFloat: 'top-2.5 text-xs',
    labelCenter:
      'peer-placeholder-shown:top-[calc(50%-1px)] peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px]',
    labelIcon: 'left-12 peer-focus:left-12',
    icon: 'left-4 h-[18px] w-[18px]',
    iconPadding: 'pl-12',
    suffixPadding: 'pr-12',
  },
}

const staticInputClass = cn(
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[14px] font-medium text-slate-900 shadow-sm outline-none transition',
  'placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15',
)

export default function FloatingInput({
  id,
  label,
  helper,
  error,
  icon: Icon,
  className,
  inputClassName,
  hasSuffix = false,
  type = 'text',
  size = 'default',
  labelVariant = 'floating',
  required = false,
  onFocus,
  onBlur,
  ...props
}) {
  const [focused, setFocused] = useState(false)
  const hasValue = String(props.value ?? '').length > 0
  const s = sizeStyles[size] || sizeStyles.default

  if (labelVariant === 'static') {
    return (
      <div className={cn(className)}>
        <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-slate-700">
          {label}
          {required && (
            <span className="ml-0.5 text-rose-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
        <div className="relative">
          {Icon && (
            <Icon
              className={cn(
                'pointer-events-none absolute top-1/2 z-10 h-[17px] w-[17px] -translate-y-1/2 text-slate-400',
                hasSuffix ? 'left-3.5' : 'left-3.5',
              )}
            />
          )}
          <input
            id={id}
            type={type}
            aria-required={required || undefined}
            {...props}
            className={cn(
              staticInputClass,
              Icon && 'pl-10',
              hasSuffix && 'pr-10',
              error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15',
              inputClassName,
            )}
            placeholder={label}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>
        {(helper || error) && (
          <p
            className={cn(
              'mt-1.5 text-[12px] leading-snug',
              error ? 'font-medium text-rose-600' : 'text-slate-500',
            )}
          >
            {error || helper}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {Icon && (
        <Icon
          className={cn(
            'pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-slate-400',
            s.icon,
          )}
        />
      )}
      <input
        id={id}
        type={type}
        {...props}
        className={cn(
          'peer w-full rounded-xl border bg-white/80 text-slate-900 shadow-sm backdrop-blur-sm transition-all outline-none',
          'border-slate-200/80 placeholder-transparent',
          'focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15',
          Icon && s.iconPadding,
          hasSuffix && s.suffixPadding,
          error && 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/15',
          s.input,
          inputClassName,
        )}
        placeholder={label}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
      />
      <label
        htmlFor={id}
        className={cn(
          'pointer-events-none absolute text-slate-500 transition-all duration-200',
          s.labelBase,
          s.labelCenter,
          'peer-focus:translate-y-0 peer-focus:font-semibold peer-focus:text-violet-600',
          size === 'default' &&
            'peer-focus:top-2 peer-focus:text-[11px] peer-placeholder-shown:text-sm',
          size === 'comfortable' && 'peer-focus:top-2.5 peer-focus:text-xs peer-placeholder-shown:text-[15px]',
          (focused || hasValue) && cn('translate-y-0 font-semibold text-violet-600', s.labelFloat),
          Icon && s.labelIcon,
          '',
        )}
      >
        {label}
      </label>
      {(helper || error) && (
        <p
          className={cn(
            'mt-2 text-[13px] leading-snug',
            error ? 'text-rose-600' : 'text-slate-500',
          )}
        >
          {error || helper}
        </p>
      )}
    </div>
  )
}
