import { Info, AlertTriangle, ShieldAlert } from 'lucide-react'
import Button from './Button'
import CommonFormModal from './CommonFormModal'

const ICONS = {
  primary: Info,
  danger: AlertTriangle,
  warning: ShieldAlert,
}

export default function ReusableDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  loading = false,
  loadingLabel = 'Please wait…',
  variant = 'primary',
  size = 'md',
  messageClassName,
}) {
  const Icon = ICONS[variant] || ICONS.primary

  return (
    <CommonFormModal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      role="alertdialog"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:items-center">
          <Button variant="secondary" onClick={onClose} disabled={loading} size="md">
            {cancelLabel}
          </Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading} size="md">
            {loading ? loadingLabel : confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary-text)]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p
            className={
              messageClassName ||
              'text-sm leading-relaxed text-[var(--color-text-sub)]'
            }
          >
            {message}
          </p>
        </div>
      </div>
    </CommonFormModal>
  )
}

