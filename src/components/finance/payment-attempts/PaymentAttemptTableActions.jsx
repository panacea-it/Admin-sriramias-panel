import { MessageSquarePlus, UserPlus } from 'lucide-react'
import IconActionButton from '../../common/IconActionButton'
import ViewButton from '../../common/ViewButton'
import { isCounselorAssigned } from '../../../utils/paymentAttemptRemarks'
import { TABLE_ACTIONS_WRAP } from '../../../utils/tableColumnHelpers'

export default function PaymentAttemptTableActions({
  row,
  hasRemark,
  onView,
  onAssignCounselor,
  onAddRemark,
}) {
  const assigned = isCounselorAssigned(row)
  const attemptLabel = row.attemptId || row.id

  return (
    <div className={TABLE_ACTIONS_WRAP}>
      <ViewButton
        onClick={onView}
        label={`View attempt ${attemptLabel}`}
      />

      {assigned && !hasRemark ? (
        <IconActionButton
          label={`Add counselor remark for ${row.student}`}
          onClick={onAddRemark}
          className="text-[#555] hover:border-slate-200 hover:bg-slate-100 hover:text-[#246392] hover:shadow-sm"
        >
          <MessageSquarePlus className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
        </IconActionButton>
      ) : null}

      {!assigned ? (
        <IconActionButton
          label={`Assign counselor for ${row.student}`}
          onClick={onAssignCounselor}
          className="text-[#555] hover:border-slate-200 hover:bg-slate-100 hover:text-[#246392] hover:shadow-sm"
        >
          <UserPlus className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
        </IconActionButton>
      ) : null}
    </div>
  )
}
