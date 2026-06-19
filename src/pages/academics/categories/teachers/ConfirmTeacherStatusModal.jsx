import ConfirmStatusChangeModal from '../../../../components/common/ConfirmStatusChangeModal'

export default function ConfirmTeacherStatusModal({
  open,
  teacherName: _teacherName,
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
