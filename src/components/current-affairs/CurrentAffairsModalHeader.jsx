import { BookMarked } from 'lucide-react'
import { cn } from '../../utils/cn'
import CurrentAffairsDialogCloseButton from './CurrentAffairsDialogCloseButton'

export default function CurrentAffairsModalHeader({
  title,
  subtitle,
  onClose,
  icon: Icon = BookMarked,
  iconClassName = 'text-[#dc2626]',
  closeDisabled = false,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl bg-gradient-to-r from-[#55ace7] via-[#5a7ba8] to-[#1a3a5c] px-5 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
          <Icon className={cn('h-6 w-6', iconClassName)} strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-sm font-medium text-white/85">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {onClose ? (
        <CurrentAffairsDialogCloseButton onClick={onClose} disabled={closeDisabled} />
      ) : null}
    </div>
  )
}
