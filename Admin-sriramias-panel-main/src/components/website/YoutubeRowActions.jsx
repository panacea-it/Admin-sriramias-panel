import { useState } from 'react'
import { Edit3, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import { websiteInputClass } from './websiteUi'

export default function YoutubeRowActions({
  onEdit,
  onDelete,
  onSetRank,
  onRemoveRank,
  priorityOrder,
  compact = true,
}) {
  const [rankInput, setRankInput] = useState('')

  const submitRank = () => {
    const n = parseInt(rankInput, 10)
    if (n >= 1) onSetRank?.(n)
    setRankInput('')
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', !compact && 'gap-3')}>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1 text-sm font-medium text-[#686868] hover:text-[#246392]"
      >
        <Edit3 className="h-4 w-4" />
        <span className="hidden sm:inline">Edit</span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex items-center gap-1 text-sm font-medium text-[#c96565] hover:text-[#b94b4b]"
      >
        <Trash2 className="h-4 w-4" />
        <span className="hidden sm:inline">Delete</span>
      </button>
      <div className="flex items-center gap-1 rounded-lg bg-[#f4f8fc] px-1.5 py-1 ring-1 ring-[#e2ebf5]">
        <input
          type="number"
          min={1}
          value={rankInput}
          onChange={(e) => setRankInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitRank()}
          placeholder={priorityOrder ? `#${priorityOrder}` : 'Rank'}
          className={cn(websiteInputClass, 'h-8 w-16 px-2 text-xs font-bold')}
          title="Set priority rank"
        />
        <button
          type="button"
          onClick={submitRank}
          className="rounded-md bg-[#246392] px-2 py-1 text-[10px] font-bold text-white hover:bg-[#1a3a5c]"
        >
          Set
        </button>
        {priorityOrder ? (
          <button
            type="button"
            onClick={onRemoveRank}
            className="px-1 text-[10px] font-bold text-[#c96565]"
            title="Remove rank"
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  )
}
