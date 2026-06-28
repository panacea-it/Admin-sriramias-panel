import ConfirmStatusChangeModal from '../../common/ConfirmStatusChangeModal'

export default function ConfirmExamPatternStatusModal({
  open,
  activating,
  enabling,
  loading,
  onCancel,
  onConfirm,
}) {
  return (
    <ConfirmStatusChangeModal
      open={open}
      activating={activating ?? enabling}
      loading={loading}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
