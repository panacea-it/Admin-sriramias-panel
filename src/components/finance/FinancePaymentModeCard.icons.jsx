import { Banknote, CircleDot, CreditCard, FileText, Globe, Landmark, Plane, Repeat, Smartphone, Wallet } from 'lucide-react'
import { cn } from '../../utils/cn'

const ICON_MAP = {
  globe: Globe,
  smartphone: Smartphone,
  'credit-card': CreditCard,
  landmark: Landmark,
  banknote: Banknote,
  wallet: Wallet,
  'file-text': FileText,
  repeat: Repeat,
  plane: Plane,
  'circle-dot': CircleDot,
}

export function PaymentModeIcon({ icon = 'circle-dot', className }) {
  const Icon = ICON_MAP[icon] || CircleDot
  return (
    <span
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef6fc] text-[#246392] ring-1 ring-inset ring-[#55ace7]/15',
        className,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  )
}
