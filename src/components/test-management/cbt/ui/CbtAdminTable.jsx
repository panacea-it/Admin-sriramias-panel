import AdminStandardTable from '../../../admin/AdminStandardTable'
import { CBT_ADMIN_TABLE_PROPS, CBT_TABLE_PAGINATION_CLASS } from './cbtTableStyles'
import { cn } from '../../../../utils/cn'

/** Center Management table styling for all CBT data tables. */
export default function CbtAdminTable({ paginationClassName, density, rowClassName, ...props }) {
  return (
    <AdminStandardTable
      density={density ?? CBT_ADMIN_TABLE_PROPS.density}
      rowClassName={rowClassName ?? CBT_ADMIN_TABLE_PROPS.rowClassName}
      paginationClassName={cn(CBT_TABLE_PAGINATION_CLASS, paginationClassName)}
      {...props}
    />
  )
}
