import { cn } from '../../../../utils/cn'

/** Dark navy back button on gradient page banner (matches screenshots) */
const BACK_BUTTON_CLASS =
  'inline-flex h-10 min-h-[38px] items-center justify-center gap-2 rounded-lg bg-[#1a3a5c] px-4 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition hover:bg-[#152f4a] sm:text-base'

export default function CbtBackButton({ children, className, ...rest }) {
  return (
    <button type="button" className={cn(BACK_BUTTON_CLASS, className)} {...rest}>
      {children}
    </button>
  )
}
