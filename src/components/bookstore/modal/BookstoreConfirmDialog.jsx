import { Loader2 } from 'lucide-react'
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
  loadingLabel,
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
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {loadingLabel || confirmLabel}
              </span>
            ) : (
              confirmLabel
            )}
          </Button>
        </BookstoreModalFooter>
      }
    >
      <p className="text-sm leading-relaxed text-[#444]">{message}</p>
    </BookstoreModal>
  )
}
