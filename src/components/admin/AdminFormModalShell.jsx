import { BookMarked } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import { cn } from '../../utils/cn'
import {
  ADMIN_MODAL_BODY_SCROLL,
  ADMIN_MODAL_FOOTER,
  ADMIN_MODAL_FORM_BG,
} from '../../utils/adminUiStandards'

/**
 * Standard create/edit modal shell — matches Add User (UserFormModal) design.
 */
export default function AdminFormModalShell({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon = BookMarked,
  iconClassName = 'text-[#246392]',
  children,
  footer,
  size = 'lg',
  maxHeightClass = 'max-h-[min(90vh,760px)]',
}) {
  return (
    <Modal open={open} onClose={onClose} size={size} title={title} showCloseButton={false}>
      <div className={cn(ADMIN_MODAL_FORM_BG, maxHeightClass)}>
        <ModalPanelHeader
          title={title}
          subtitle={subtitle}
          icon={Icon}
          iconClassName={iconClassName}
          onClose={onClose}
          closeVariant="icon"
          plainCloseIcon
        />
        <div className={ADMIN_MODAL_BODY_SCROLL}>{children}</div>
        {footer ? <div className={ADMIN_MODAL_FOOTER}>{footer}</div> : null}
      </div>
    </Modal>
  )
}
