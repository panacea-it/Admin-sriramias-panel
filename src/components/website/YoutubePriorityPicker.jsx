import { useState } from 'react'
import { cn } from '../../utils/cn'
import { websiteInputClass } from './websiteUi'
import { normalizeRankInput } from '../../utils/youtubeVideoPriority'

export default function YoutubePriorityPicker({ value = '', onChange, className }) {
  const [local, setLocal] = useState(value === '0' || !value ? '' : String(value))

  const apply = (raw) => {
    setLocal(raw)
    const rank = normalizeRankInput(raw)
    onChange?.(rank == null ? '' : String(rank))
  }

  return (
    <div className={cn('space-y-2 rounded-xl bg-[#f8fbff] p-4 ring-1 ring-[#d8e8f5]', className)}>
      <label className="text-sm font-semibold text-[#333]" htmlFor="priority-order-input">
        Priority Order
      </label>
      <input
        id="priority-order-input"
        type="number"
        min={1}
        step={1}
        value={local}
        onChange={(e) => apply(e.target.value)}
        placeholder="Enter priority rank"
        className={cn(websiteInputClass, 'font-bold')}
      />
      <p className="text-xs text-[#686868]">
        Enter any positive rank (1 = highest). Inserting at an occupied rank shifts others
        down automatically.
      </p>
      <button
        type="button"
        onClick={() => apply('')}
        className="text-xs font-semibold text-[#246392] hover:underline"
      >
        Clear rank (unranked)
      </button>
    </div>
  )
}
