import { cn } from '../../utils/cn'

export default function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-sm font-bold text-white shadow">
        {rank}
      </span>
    )
  }
  if (rank <= 3) {
    return (
      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-gradient-to-r from-slate-300 to-slate-400 text-sm font-bold text-white">
        {rank}
      </span>
    )
  }
  return (
    <span className={cn('text-sm font-semibold text-[#686868]')}>{rank}</span>
  )
}
