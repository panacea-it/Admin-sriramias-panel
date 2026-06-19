import { Eye, PlayCircle, UserPlus } from 'lucide-react'
import ViewButton from '../../common/ViewButton'
import IconActionButton from '../../common/IconActionButton'
import { TABLE_ACTIONS_WRAP_CENTER } from '../../../utils/tableColumnHelpers'

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
    <div className={TABLE_ACTIONS_WRAP_CENTER}>
      <ViewButton onClick={() => onViewPaper(row)} label="View Paper" />
      <IconActionButton
        label={hasMentor ? 'Reassign Evaluator' : 'Assign Evaluator'}
        onClick={() => onAssignEvaluator(row)}
        className="text-[#555] hover:border-slate-200 hover:bg-slate-100 hover:text-[#246392] hover:shadow-sm"
      >
        <UserPlus className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
      </IconActionButton>
      <IconActionButton
        label={evaluationLabel}
        onClick={() => onOpenEvaluation(row)}
        className="text-[#555] hover:border-slate-200 hover:bg-slate-100 hover:text-[#246392] hover:shadow-sm"
      >
        {isEvaluated ? (
          <Eye className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
        ) : (
          <PlayCircle className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
        )}
      </IconActionButton>
    </div>
  )
}
