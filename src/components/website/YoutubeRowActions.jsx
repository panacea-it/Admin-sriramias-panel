import { useState } from 'react'
import { Ban, Check } from 'lucide-react'
import EditButton from '../common/EditButton'
import IconActionButton from '../common/IconActionButton'
import { cn } from '../../utils/cn'
import { TABLE_ACTIONS_WRAP } from '../../utils/tableColumnHelpers'
import { normalizeRankInput } from '../../utils/youtubeVideoPriority'

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
      className={cn(TABLE_ACTIONS_WRAP, 'items-center')}
    >
      {!rankOnly && (
        <>
          <EditButton
            onClick={(e) => {
              e?.stopPropagation?.()
              onEdit?.()
            }}
            label={`Edit ${rowName}`}
          />

          <IconActionButton
            label={isActive ? `Set ${rowName} inactive` : `Set ${rowName} active`}
            onClick={(e) => {
              e?.stopPropagation?.()
              onStatusChange?.(isActive ? 'Inactive' : 'Active')
            }}
            className="text-amber-700 hover:border-amber-100 hover:bg-amber-50 hover:text-amber-800"
          >
            <Ban className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
          </IconActionButton>
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
            title="Set rank"
            aria-label="Set priority rank"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#246392] text-white hover:bg-[#1a3a5c] disabled:opacity-60"
          >
            <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
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
