import ReusableDialog from '../ui/ReusableDialog'

export default function ConfirmActionDialog({
  open,
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'primary',
}) {
  return (
    <ReusableDialog
      open={open}
      onClose={onCancel}
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onConfirm={onConfirm}
      loading={loading}
      variant={variant}
      size="md"
    />
  )
}
