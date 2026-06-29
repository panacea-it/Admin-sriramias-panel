import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import {
  ADMIN_TABLE_INNER_CLASS,
  ADMIN_TABLE_PAGINATION_CLASS,
  ADMIN_TABLE_ROW_CLASS,
} from '../../utils/adminUiStandards'

export default function BlogManagementTable({
  columns,
  data,
  emptyMessage = 'No Blogs Found',
  itemLabel = 'blogs',
  initialPageSize = 10,
  resetDeps = [],
  loading = false,
  controlledPagination,
}) {
  return (
    <PaginatedFigmaTable
      columns={columns}
      data={data}
      emptyMessage={emptyMessage}
      itemLabel={itemLabel}
      initialPageSize={initialPageSize}
      resetDeps={resetDeps}
      loading={loading}
      controlledPagination={controlledPagination}
      skeletonRowCount={8}
      density="comfortable"
      rowClassName={ADMIN_TABLE_ROW_CLASS}
      tableClassName={ADMIN_TABLE_INNER_CLASS}
      paginationClassName={ADMIN_TABLE_PAGINATION_CLASS}
      headerFillColumn
      suppressInnerScroll
    />
  )
}
