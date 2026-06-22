import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import {
  ADMIN_TABLE_DENSITY,
  ADMIN_TABLE_INNER_CLASS,
  ADMIN_TABLE_PAGINATION_CLASS,
  ADMIN_TABLE_ROW_CLASS,
} from '../../utils/adminUiStandards'
import { cn } from '../../utils/cn'

/**
 * PaginatedFigmaTable pre-configured to match Center Management table styling.
 */
export default function AdminStandardTable({
  density = ADMIN_TABLE_DENSITY,
  rowClassName = ADMIN_TABLE_ROW_CLASS,
  tableClassName = ADMIN_TABLE_INNER_CLASS,
  className = ADMIN_TABLE_INNER_CLASS,
  paginationClassName,
  ...props
}) {
  return (
    <PaginatedFigmaTable
      variant="admin"
      density={density}
      rowClassName={rowClassName}
      tableClassName={tableClassName}
      className={className}
      paginationClassName={cn(ADMIN_TABLE_PAGINATION_CLASS, paginationClassName)}
      {...props}
    />
  )
}
