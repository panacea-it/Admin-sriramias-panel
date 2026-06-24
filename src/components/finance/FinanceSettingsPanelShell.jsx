import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import { cn } from '../../utils/cn'

/**
 * Finance settings panel — matches EditPaymentModal / offline payment panel styling.
 */
export default function FinanceSettingsPanelShell({
  open,
  onClose,
  title,
  subtitle,
  icon,
  size = 'lg',
  zIndex,
  children,
  footer,
  className,
  panelClassName,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      zIndex={zIndex}
      showCloseButton={false}
      className={cn('p-0', className)}
    >
      <div
        className={cn(
          'flex max-h-[100dvh] flex-col overflow-hidden rounded-2xl bg-[#f0f4f8] shadow-[0_24px_60px_rgba(15,23,42,0.22)] sm:max-h-[min(92vh,720px)]',
          panelClassName,
        )}
      >
        <ModalPanelHeader
          title={title}
          subtitle={subtitle}
          onClose={onClose}
          icon={icon}
          iconClassName="text-[#246392]"
          closeVariant="icon"
        />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-slate-200/80 bg-[#f0f4f8] px-5 py-4 sm:px-6">{footer}</div>
        ) : null}
      </div>
    </Modal>
  )
}
