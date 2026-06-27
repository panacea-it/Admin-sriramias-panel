import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import { cn } from '../../utils/cn'

/** Matches CbtMappingTable / CbtTopicsManagementTable pagination styling */
export const TEST_CONFIG_TABLE_PAGINATION_CLASS = cn(
  '[&>div:last-child]:items-center',
  '[&_nav]:items-center',
  '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
  '[&_form_input]:h-9 [&_form_input]:leading-none',
  '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
)

/**
 * Test Configuration tables — matches CBT Management table styling.
 */
export default function TestConfigDataTable({ skeletonRowCount = 8, ...props }) {
  return (
    <PaginatedFigmaTable
      skeletonRowCount={skeletonRowCount}
      density="comfortable"
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      paginationClassName={TEST_CONFIG_TABLE_PAGINATION_CLASS}
      {...props}
    />
  )
}
