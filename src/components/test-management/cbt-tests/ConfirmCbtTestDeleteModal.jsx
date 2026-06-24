import ConfirmDeleteDialog from '../../subjects/ConfirmDeleteDialog'

export default function ConfirmCbtTestDeleteModal({
  open,
  testName,
  loading,
  onConfirm,
  onClose,
}) {
  return (
    <ConfirmDeleteDialog
      open={open}
      title="Delete CBT test"
      message={
        testName
          ? `Delete "${testName}"? This soft-deletes the test and all its questions.`
          : 'Delete this CBT test? This soft-deletes the test and all its questions.'
      }
      confirmLabel="Delete"
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onClose}
    />
  )
}
