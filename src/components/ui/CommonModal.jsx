import AppModalWrapper from './AppModalWrapper'
import { cn } from '../../utils/cn'

export default function CommonModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'lg',
  className,
  contentClassName,
  role = 'dialog',
}) {
  return (
    <AppModalWrapper
      open={open}
      onClose={onClose}
      title={title || 'Dialog'}
      size={size}
      role={role}
    >
      <div className={cn('relative px-0', className)}>
        {(title || subtitle) && (
          <div className="border-b border-[var(--color-border)] bg-[var(--color-card)] px-6 py-4 sm:px-8">
            {title ? (
              <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-main)] sm:text-xl">
                {title}
              </h2>
            ) : null}
            {subtitle ? <p className="mt-1 text-sm text-[var(--color-text-sub)]">{subtitle}</p> : null}
          </div>
        )}

        <div className={cn(contentClassName, (title || subtitle) && 'p-6 sm:p-8', !(title || subtitle) && 'p-6 sm:p-8')}>
          {children}
        </div>

        {footer ? (
          <div className="border-t border-[var(--color-border)] bg-[var(--color-card)] px-6 py-4 sm:px-8">
            {footer}
          </div>
        ) : null}
      </div>
    </AppModalWrapper>
  )
}

