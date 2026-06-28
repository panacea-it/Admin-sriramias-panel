import ConfirmDeleteDialog from '../../subjects/ConfirmDeleteDialog'

export default function ConfirmOmrResultDeleteModal({
  open,
  examName,
  loading = false,
  onClose,
  onConfirm,
}) {
  return (
    <ConfirmDeleteDialog
      open={open}
      title="Delete result sheet?"
      message={
        examName
          ? `Remove the result sheet for "${examName}"? The exam record will remain.`
          : 'Remove this result sheet? The exam record will remain.'
      }
      confirmLabel="Delete sheet"
      loading={loading}
      onCancel={onClose}
      onConfirm={onConfirm}
    />
  )
}
