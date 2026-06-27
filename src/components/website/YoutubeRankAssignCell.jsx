import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import YoutubePriorityBadge from './YoutubePriorityBadge'
import { cn } from '../../utils/cn'

function validateRankInput(raw) {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) {
    return { rank: null, error: 'Rank is required.' }
  }

  const rank = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(rank) || rank < 1 || !Number.isInteger(rank)) {
    return { rank: null, error: 'Rank must be a positive integer.' }
  }

  return { rank, error: '' }
}

export default function YoutubeRankAssignCell({
  videoId,
  currentRank,
  onAssign,
  assigning = false,
}) {
  const [rankInput, setRankInput] = useState('')
  const [error, setError] = useState('')

  const submitRank = async (event) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()

    const { rank, error: validationError } = validateRankInput(rankInput)
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    try {
      await onAssign?.(videoId, rank)
      setRankInput('')
    } catch (assignError) {
      if (assignError instanceof Error && assignError.message) {
        setError(assignError.message)
      }
    }
  }

  return (
    <div className="flex min-w-[140px] flex-col gap-1.5">
      {currentRank ? (
        <YoutubePriorityBadge priorityOrder={currentRank} stacked />
      ) : (
        <span className="text-sm text-[#9ca0a8]">Unranked</span>
      )}

      <div className="flex items-center gap-1 rounded-lg bg-[#f4f8fc] px-1.5 py-1 ring-1 ring-[#e2ebf5]">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={rankInput}
          disabled={assigning}
          onChange={(event) => {
            setRankInput(event.target.value.replace(/\D/g, ''))
            setError('')
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.stopPropagation()
              submitRank(event)
            }
          }}
          onClick={(event) => event.stopPropagation()}
          placeholder={currentRank ? `#${currentRank}` : 'Rank'}
          aria-label="Assign video rank"
          aria-invalid={Boolean(error)}
          className={cn(
            'h-8 w-14 rounded-md border-0 bg-white px-2 text-xs font-bold text-[#111] outline-none focus:ring-2 focus:ring-[#55ace7]/40 sm:w-16',
            assigning && 'opacity-60',
          )}
        />
        <button
          type="button"
          onClick={submitRank}
          disabled={assigning}
          title="Assign rank"
          aria-label="Assign video rank"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#246392] text-white hover:bg-[#1a3a5c] disabled:opacity-60"
        >
          {assigning ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          )}
        </button>
      </div>

      {error ? <span className="text-[10px] font-medium text-[#dc2626]">{error}</span> : null}
    </div>
  )
}
