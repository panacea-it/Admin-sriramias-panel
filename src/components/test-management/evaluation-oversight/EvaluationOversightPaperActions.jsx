import { Eye, PlayCircle, UserPlus } from 'lucide-react'
import { cn } from '../../../utils/cn'

const actionButtonClass =
  'inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition sm:min-w-0 sm:px-2.5'

export default function EvaluationOversightPaperActions({
  row,
  onViewPaper,
  onAssignEvaluator,
  onOpenEvaluation,
}) {
  const hasMentor = Boolean(row.mentorName)
  const isEvaluated = row.status === 'Evaluated'
  const evaluationLabel = isEvaluated ? 'View Evaluation' : 'Start Evaluation'

  return (
    <div className="flex flex-nowrap items-center justify-center gap-1 sm:gap-1.5">
      <button
        type="button"
        onClick={() => onViewPaper(row)}
        title="View Paper"
        aria-label={`View paper for ${row.studentName}`}
        className={cn(
          actionButtonClass,
          'text-slate-500 hover:bg-slate-100 hover:text-[#246392]',
        )}
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">View</span>
      </button>
      <button
        type="button"
        onClick={() => onAssignEvaluator(row)}
        title={hasMentor ? 'Reassign Evaluator' : 'Assign Evaluator'}
        aria-label={
          hasMentor
            ? `Reassign evaluator for ${row.studentName}`
            : `Assign evaluator for ${row.studentName}`
        }
        className={cn(
          actionButtonClass,
          'text-slate-500 hover:bg-slate-100 hover:text-[#246392]',
        )}
      >
        <UserPlus className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">{hasMentor ? 'Reassign' : 'Assign'}</span>
      </button>
      <button
        type="button"
        onClick={() => onOpenEvaluation(row)}
        title={evaluationLabel}
        aria-label={`${evaluationLabel} for ${row.studentName}`}
        className={cn(
          actionButtonClass,
          'text-slate-500 hover:bg-slate-100 hover:text-[#246392]',
        )}
      >
        {isEvaluated ? (
          <Eye className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <PlayCircle className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="hidden sm:inline">{isEvaluated ? 'Results' : 'Evaluate'}</span>
      </button>
    </div>
  )
}
