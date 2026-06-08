import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function LoadingState({ message = 'Loading...', className }) {
  return (
    <div
      className={cn(
        'flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl bg-white p-8 shadow-[0_4px_16px_rgba(0,0,0,0.06)]',
        className,
      )}
    >
      <Loader2 className="h-9 w-9 animate-spin text-[#55ace7]" />
      <p className="text-sm font-semibold text-[#686868]">{message}</p>
    </div>
  )
}
