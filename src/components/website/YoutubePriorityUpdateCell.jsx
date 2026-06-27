import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import YoutubePriorityBadge from './YoutubePriorityBadge'
import { cn } from '../../utils/cn'

function validatePriorityInput(raw) {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) {
    return { priority: null, error: 'Priority is required.' }
  }

  const priority = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(priority) || priority < 1 || !Number.isInteger(priority)) {
    return { priority: null, error: 'Priority must be a positive integer.' }
  }

  return { priority, error: '' }
}

export default function YoutubePriorityUpdateCell({
  videoId,
  currentPriority,
  onUpdate,
  updating = false,
}) {
  const [priorityInput, setPriorityInput] = useState('')
  const [error, setError] = useState('')

  const submitPriority = async (event) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()

    const { priority, error: validationError } = validatePriorityInput(priorityInput)
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    try {
      await onUpdate?.(videoId, priority)
      setPriorityInput('')
    } catch (updateError) {
      if (updateError instanceof Error && updateError.message) {
        setError(updateError.message)
      }
    }
  }

  return (
    <div className="flex min-w-[140px] flex-col gap-1.5">
      {currentPriority > 0 ? (
        <YoutubePriorityBadge priorityOrder={currentPriority} stacked />
      ) : (
        <span className="text-sm text-[#9ca0a8]">—</span>
      )}

      <div className="flex items-center gap-1 rounded-lg bg-[#f4f8fc] px-1.5 py-1 ring-1 ring-[#e2ebf5]">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={priorityInput}
          disabled={updating}
          onChange={(event) => {
            setPriorityInput(event.target.value.replace(/\D/g, ''))
            setError('')
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.stopPropagation()
              submitPriority(event)
            }
          }}
          onClick={(event) => event.stopPropagation()}
          placeholder={currentPriority > 0 ? String(currentPriority) : 'Priority'}
          aria-label="Update video priority"
          aria-invalid={Boolean(error)}
          className={cn(
            'h-8 w-14 rounded-md border-0 bg-white px-2 text-xs font-bold text-[#111] outline-none focus:ring-2 focus:ring-[#55ace7]/40 sm:w-16',
            updating && 'opacity-60',
          )}
        />
        <button
          type="button"
          onClick={submitPriority}
          disabled={updating}
          title="Update priority"
          aria-label="Update video priority"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#246392] text-white hover:bg-[#1a3a5c] disabled:opacity-60"
        >
          {updating ? (
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
