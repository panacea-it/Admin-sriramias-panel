import AdminStandardTable from '../../../admin/AdminStandardTable'
import { CBT_TABLE_PAGINATION_CLASS } from './cbtTableStyles'
import { cn } from '../../../../utils/cn'

/** Center Management table styling for CBT data tables. */
export default function CbtAdminTable({ paginationClassName, ...props }) {
  return (
    <AdminStandardTable
      paginationClassName={cn(CBT_TABLE_PAGINATION_CLASS, paginationClassName)}
      {...props}
    />
  )
}
