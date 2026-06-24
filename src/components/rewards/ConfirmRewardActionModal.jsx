import AdminConfirmModal from '../admin/AdminConfirmModal'

export default function ConfirmRewardActionModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading,
  onCancel,
  onConfirm,
  variant = 'primary',
}) {
  return (
    <AdminConfirmModal
      open={open}
      onClose={onCancel}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      loading={loading}
      variant={variant}
    />
  )
}
