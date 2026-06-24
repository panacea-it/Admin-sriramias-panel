import { cn } from '../../utils/cn'
import { ADMIN_DATA_PANEL, ADMIN_TABLE_CONTAINER } from '../../utils/adminUiStandards'

/**
 * White content card matching Center Management — filters/toolbar on top, table below.
 */
export default function AdminDataPanel({
  toolbar,
  bulkActions,
  children,
  className,
  tableClassName,
  noTableWrap = false,
}) {
  return (
    <div className={cn(ADMIN_DATA_PANEL, className)}>
      {toolbar}
      {bulkActions}
      {noTableWrap ? (
        children
      ) : (
        <div className={cn(ADMIN_TABLE_CONTAINER, tableClassName)}>{children}</div>
      )}
    </div>
  )
}
