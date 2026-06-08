import ReusableDialog from '../ui/ReusableDialog'

/** Finance-scoped confirmation dialog — consistent with finance theme */
export default function FinanceConfirmDialog({
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
