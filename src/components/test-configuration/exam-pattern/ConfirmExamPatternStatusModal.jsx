import ConfirmStatusChangeModal from '../../common/ConfirmStatusChangeModal'

export default function ConfirmExamPatternStatusModal({
  open,
  enabling,
  loading,
  onCancel,
  onConfirm,
}) {
  return (
    <ConfirmStatusChangeModal
      open={open}
      activating={enabling}
      loading={loading}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
