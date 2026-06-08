import { cn } from '../../../utils/cn'

const DOT = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
}

export default function WorkloadIndicator({ level = 'low', className }) {
  return (
    <span
      className={cn('inline-block h-2 w-2 shrink-0 rounded-full', DOT[level] || DOT.low, className)}
      title={level === 'high' ? 'High workload' : level === 'medium' ? 'Medium workload' : 'Low workload'}
      aria-hidden
    />
  )
}
