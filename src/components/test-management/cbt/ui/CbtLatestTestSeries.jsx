import { ClipboardCheck } from 'lucide-react'
import { cn } from '../../../../utils/cn'
import CbtProgressCard from './CbtProgressCard'
import { CBT_PROGRESS_GRID_CLASS } from './cbtUiConstants'

function ProgressCardSkeleton() {
  return (
    <article className="flex h-full animate-pulse flex-col rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)] sm:p-5">
      <div className="mb-3 h-4 w-3/4 rounded bg-slate-200" />
      <div className="mb-2 h-3 w-full rounded bg-slate-100" />
      <div className="mb-2 h-3 w-5/6 rounded bg-slate-100" />
      <div className="mt-auto h-2 w-full rounded-full bg-slate-100" />
    </article>
  )
}

export default function CbtLatestTestSeries({
  cards = [],
  loading = false,
  emptyMessage = 'No tests conducted yet.',
  onCardClick,
  heading = 'Latest Test Series',
  showUploadedSheets = false,
  resultsLineLabel = 'evaluation',
  className,
}) {
  if (loading) {
    return (
      <section className={className}>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1a3a5c] sm:mb-4 sm:text-base">
          <ClipboardCheck className="h-4 w-4 shrink-0 text-[#55ace7]" />
          {heading}
        </h2>
        <div className={CBT_PROGRESS_GRID_CLASS}>
          <ProgressCardSkeleton />
          <ProgressCardSkeleton />
          <ProgressCardSkeleton />
        </div>
      </section>
    )
  }

  if (!cards.length) {
    return (
      <section
        className={cn(
          'rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-[var(--card-shadow)] sm:p-10',
          className,
        )}
      >
        <ClipboardCheck className="mx-auto mb-2 h-8 w-8 text-slate-300" />
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </section>
    )
  }

  return (
    <section className={className}>
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#1a3a5c] sm:text-lg">
        <ClipboardCheck className="h-5 w-5 shrink-0 text-[#55ace7]" />
        {heading}
      </h2>
      <div className={CBT_PROGRESS_GRID_CLASS}>
        {cards.map((card) => (
          <CbtProgressCard
            key={card.id}
            card={card}
            showUploadedSheets={showUploadedSheets}
            resultsLineLabel={resultsLineLabel}
            onOpen={onCardClick ? () => onCardClick(card) : undefined}
          />
        ))}
      </div>
    </section>
  )
}
