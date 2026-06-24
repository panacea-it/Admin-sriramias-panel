import { cn } from '../../utils/cn'

/** White card wrapper for Add Batch form sections */
export default function BatchFormSection({ children, className }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm sm:p-8',
        className,
      )}
    >
      {children}
    </div>
  )
}
