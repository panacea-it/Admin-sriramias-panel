import ConfirmDeleteDialog from '../../subjects/ConfirmDeleteDialog'

export default function ConfirmOmrDeleteModal({
  open,
  exam,
  loading = false,
  onClose,
  onConfirm,
}) {
  return (
    <ConfirmDeleteDialog
      open={open}
      title="Delete OMR exam?"
      message={
        exam?.examName
          ? `Delete "${exam.examName}"? This removes the exam and any uploaded result sheet permanently.`
          : 'Delete this OMR exam permanently? Any uploaded result sheet will also be removed.'
      }
      confirmLabel="Delete exam"
      loading={loading}
      onCancel={onClose}
      onConfirm={onConfirm}
    />
  )
}
