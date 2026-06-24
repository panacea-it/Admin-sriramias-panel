import AppModalWrapper from './AppModalWrapper'
import { cn } from '../../utils/cn'

export default function CommonFormModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'lg',
  role = 'dialog',
  className,
  zIndex,
}) {
  return (
    <AppModalWrapper
      open={open}
      onClose={onClose}
      title={title || 'Dialog'}
      size={size}
      role={role}
      zIndex={zIndex}
      className={cn('overflow-hidden rounded-xl bg-white shadow-xl', className)}
    >
      <div className="flex min-h-0 flex-col">
        {(title || subtitle) && (
          <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-card)] px-6 py-4 sm:px-8">
            {title ? (
              <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-main)] sm:text-xl">
                {title}
              </h2>
            ) : null}
            {subtitle ? <p className="mt-1 text-sm text-[var(--color-text-sub)]">{subtitle}</p> : null}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">{children}</div>

        {footer ? (
          <div className="sticky bottom-0 z-10 border-t border-[var(--color-border)] bg-[var(--color-card)] px-6 py-4 sm:px-8">
            {footer}
          </div>
        ) : null}
      </div>
    </AppModalWrapper>
  )
}

