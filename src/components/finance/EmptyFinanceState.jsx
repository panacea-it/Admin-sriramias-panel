import { Wallet, PlusCircle } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function EmptyFinanceState({
  title = 'No finance records',
  description = 'Payments and reports will appear here once available.',
  ctaLabel,
  onCta,
  icon: Icon = Wallet,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#55ace7]/25 bg-white/80 px-6 py-16 text-center shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:py-20',
        className,
      )}
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e8f4fc] to-[#d1e9f6] shadow-inner">
        <Icon className="h-10 w-10 text-[#246392]" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-[#222] sm:text-xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm font-medium text-[#686868]">{description}</p>
      {ctaLabel && onCta && (
        <button
          type="button"
          onClick={onCta}
          className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-6 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(3,4,94,0.35)] transition hover:scale-[1.03] hover:shadow-[0_8px_22px_rgba(3,4,94,0.4)] active:scale-[0.98]"
        >
          <PlusCircle className="h-4 w-4" strokeWidth={2.2} />
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
