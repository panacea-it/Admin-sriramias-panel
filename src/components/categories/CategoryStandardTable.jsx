import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import {
  CATEGORY_TABLE_INNER_CLASS,
  CATEGORY_TABLE_MIN_WIDTH,
  CATEGORY_TABLE_PAGINATION_CLASS,
  CATEGORY_TABLE_ROW_CLASS,
  CATEGORY_TABLE_SHELL,
} from '../../utils/categoryUiStandards'
import { cn } from '../../utils/cn'

/**
 * Standard category listing table — matches Exam Sub Category layout exactly.
 */
export default function CategoryStandardTable({
  tableMinWidth = CATEGORY_TABLE_MIN_WIDTH,
  className,
  tableClassName,
  rowClassName = CATEGORY_TABLE_ROW_CLASS,
  paginationClassName,
  density = 'comfortable',
  ...rest
}) {
  return (
    <div className={cn(CATEGORY_TABLE_SHELL, className)}>
      <PaginatedFigmaTable
        density={density}
        rowClassName={rowClassName}
        tableClassName={cn(CATEGORY_TABLE_INNER_CLASS, tableClassName)}
        tableMinWidth={tableMinWidth}
        paginationClassName={cn(CATEGORY_TABLE_PAGINATION_CLASS, paginationClassName)}
        {...rest}
      />
    </div>
  )
}
