import ConfirmStatusChangeModal from '../../../../../components/common/ConfirmStatusChangeModal'
import { formatPublishStatusLabel } from '../../../../../utils/facultySubjectChildApiHelpers'

export default function PublishStatusConfirmModal({
  open,
  row,
  loading,
  onCancel,
  onConfirm,
}) {
  const isPublished = row?.publishStatus === 'PUBLISHED'
  const nextLabel = isPublished ? 'Unpublished' : 'Published'

  return (
    <ConfirmStatusChangeModal
      open={open}
      activating={!isPublished}
      loading={loading}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={`Set publish status to ${nextLabel}?`}
      message={
        row
          ? `"${row.testName}" is currently ${formatPublishStatusLabel(row.publishStatus)}. Continue?`
          : 'Update publish status for this entry?'
      }
    />
  )
}
