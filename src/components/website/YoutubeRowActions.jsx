import { useState } from 'react'
import { Ban, Pencil } from 'lucide-react'
import { cn } from '../../utils/cn'
import { normalizeRankInput } from '../../utils/youtubeVideoPriority'

const actionButtonClass =
  'inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition sm:min-w-0 sm:px-2.5'

export default function YoutubeRowActions({
  rowName = 'video',
  onEdit,
  onSetRank,
  onRemoveRank,
  onStatusChange,
  priorityOrder,
  status,
  rankOnly = false,
}) {
  const [rankInput, setRankInput] = useState('')
  const [rankError, setRankError] = useState('')
  const [settingRank, setSettingRank] = useState(false)

  const isActive = status === 'Active'

  const submitRank = async (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()

    const rank = normalizeRankInput(rankInput)
    if (!rank) {
      setRankError('Enter a valid rank')
      return
    }

    setSettingRank(true)
    setRankError('')
    try {
      await onSetRank?.(rank)
      setRankInput('')
    } catch {
      setRankError('Failed to set rank')
    } finally {
      setSettingRank(false)
    }
  }

  return (
    <div
      role="group"
      aria-label={`Actions for ${rowName}`}
      className="flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5"
    >
      {!rankOnly && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.()
            }}
            title="Edit"
            aria-label={`Edit ${rowName}`}
            className={cn(
              actionButtonClass,
              'text-slate-500 hover:bg-slate-100 hover:text-[#246392]',
            )}
          >
            <Pencil className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Edit</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onStatusChange?.(isActive ? 'Inactive' : 'Active')
            }}
            title={isActive ? 'Set Inactive' : 'Set Active'}
            aria-label={isActive ? `Set ${rowName} inactive` : `Set ${rowName} active`}
            className={cn(actionButtonClass, 'text-amber-700 hover:bg-amber-50')}
          >
            <Ban className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{isActive ? 'Inactive' : 'Active'}</span>
          </button>
        </>
      )}

      <div className="flex flex-col items-end gap-0.5">
        <div className="flex items-center gap-1 rounded-lg bg-[#f4f8fc] px-1.5 py-1 ring-1 ring-[#e2ebf5]">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={rankInput}
            onChange={(e) => {
              setRankInput(e.target.value.replace(/\D/g, ''))
              setRankError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.stopPropagation()
                submitRank(e)
              }
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder={priorityOrder ? `#${priorityOrder}` : 'Rank'}
            aria-label="Set priority rank"
            className="h-8 w-14 rounded-md border-0 bg-white px-2 text-xs font-bold text-[#111] outline-none focus:ring-2 focus:ring-[#55ace7]/40 sm:w-16"
          />
          <button
            type="button"
            onClick={submitRank}
            disabled={settingRank}
            className="rounded-md bg-[#246392] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#1a3a5c] disabled:opacity-60"
          >
            {settingRank ? '…' : 'Set'}
          </button>
          {priorityOrder && onRemoveRank ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemoveRank()
              }}
              className="px-1 text-[10px] font-bold text-[#c96565]"
              title="Remove rank"
              aria-label="Remove rank"
            >
              ×
            </button>
          ) : null}
        </div>
        {rankError && (
          <span className="text-[10px] font-medium text-[#dc2626]">{rankError}</span>
        )}
      </div>
    </div>
  )
}
