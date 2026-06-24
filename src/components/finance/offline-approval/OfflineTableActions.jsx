import { Ban, FileText } from 'lucide-react'
import IconActionButton from '../../common/IconActionButton'
import ViewButton from '../../common/ViewButton'
import { TABLE_ACTIONS_WRAP } from '../../../utils/tableColumnHelpers'

export default function OfflineTableActions({ row, onPreview, onViewVerification, onDisable }) {
  const isDisabled =
    row.disabled || row.status === 'Disabled' || row.workflowStatus === 'Disabled'

  return (
    <div className={TABLE_ACTIONS_WRAP}>
      <ViewButton
        onClick={onPreview}
        label={`Preview proof for ${row.id}`}
      />

      <IconActionButton
        label={`View verification for ${row.id}`}
        onClick={onViewVerification}
        className="text-[#555] hover:border-slate-200 hover:bg-slate-100 hover:text-[#246392] hover:shadow-sm"
      >
        <FileText className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
      </IconActionButton>

      {!isDisabled ? (
        <IconActionButton
          label={`Disable ${row.id}`}
          onClick={onDisable}
          className="text-amber-700 hover:border-amber-100 hover:bg-amber-50 hover:text-amber-800"
        >
          <Ban className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
        </IconActionButton>
      ) : null}
    </div>
  )
}
