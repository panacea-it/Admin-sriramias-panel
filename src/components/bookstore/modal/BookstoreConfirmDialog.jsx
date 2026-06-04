import Button from '../../ui/Button'
import BookstoreModal, { BookstoreModalFooter } from './BookstoreModal'

export default function BookstoreConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  return (
    <BookstoreModal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      layer="elevated"
      footer={
        <BookstoreModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </BookstoreModalFooter>
      }
    >
      <p className="text-sm leading-relaxed text-[#444]">{message}</p>
    </BookstoreModal>
  )
}
