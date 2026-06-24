import ConfirmStatusChangeModal from '../../../../components/common/ConfirmStatusChangeModal'

export default function ConfirmSubjectStatusModal({
  open,
  subjectName: _subjectName,
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
