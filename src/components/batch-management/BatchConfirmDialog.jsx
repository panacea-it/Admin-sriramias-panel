import { AlertTriangle, Info, ShieldAlert } from 'lucide-react'
import BatchFormModalShell from './BatchFormModalShell'
import { BatchModalFooter } from './batchModalUi'

const ICONS = {
  primary: Info,
  danger: AlertTriangle,
  warning: ShieldAlert,
}

export default function BatchConfirmDialog({
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
}) {
  const Icon = ICONS[variant] || ICONS.primary
  const isDanger = variant === 'danger'
  const isWarning = variant === 'warning'

  return (
    <BatchFormModalShell
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      saving={loading}
      footer={
        <BatchModalFooter
          onCancel={onClose}
          cancelLabel={cancelLabel}
          submitLabel={loading ? loadingLabel : confirmLabel}
          onSubmit={onConfirm}
          saving={loading}
          variant={isDanger ? 'danger' : 'primary'}
        />
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={
            isDanger
              ? 'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600'
              : isWarning
                ? 'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700'
                : 'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef6fc] text-[#246392]'
          }
        >
          <Icon className="h-5 w-5" />
        </div>
        <p className="min-w-0 pt-1.5 text-sm leading-relaxed text-[#444]">{message}</p>
      </div>
    </BatchFormModalShell>
  )
}
