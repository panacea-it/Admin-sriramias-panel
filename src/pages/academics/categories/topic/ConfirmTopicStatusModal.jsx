import ConfirmStatusChangeModal from '../../../../components/common/ConfirmStatusChangeModal'

export default function ConfirmTopicStatusModal({
  open,
  topicName: _topicName,
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
