import { Ban, CheckCircle2, Eye, Pencil } from 'lucide-react'
import TableActionMenu, { tableActionsCellClass } from '../common/TableActionMenu'
import { recordStatusActionLabel } from '../../constants/recordStatus'
import { createActionsColumn } from '../../utils/tableColumnHelpers'
import { cn } from '../../utils/cn'

/** @deprecated Use TestConfigDataTable */
export const testConfigTablePaginationClass = cn(
  '[&>div:last-child]:items-center',
  '[&_nav]:items-center',
  '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
  '[&_form_input]:h-9 [&_form_input]:leading-none',
  '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
)

/** @deprecated Use TestConfigDataTable */
export const testConfigTableProps = {
  density: 'comfortable',
  rowClassName: 'hover:bg-[#eef6fc]/70',
  tableClassName: 'rounded-none border-0 shadow-none',
  paginationClassName: testConfigTablePaginationClass,
}

export const testConfigStatusColumn = {
  key: 'status',
  label: 'Status',
  width: 120,
  align: 'center',
  headerClassName: 'whitespace-nowrap text-center',
  cellClassName: 'whitespace-nowrap align-middle text-center',
}

export function createTestConfigActionsColumn(render) {
  return createActionsColumn({
    buttonCount: 1,
    align: 'center',
    width: 72,
    render,
  })
}

function isRowActive(status) {
  return String(status || '').trim().toLowerCase() === 'active'
}

function TestConfigActionMenu({ row, entityLabel, onView, onEdit, onToggleStatus }) {
  const isActive = isRowActive(row.status)
  const statusAction = recordStatusActionLabel(isActive ? 'Active' : 'In Active')

  return (
    <TableActionMenu
      triggerLabel={`${entityLabel} actions`}
      className="mx-auto"
      items={[
        { label: 'View', icon: Eye, onClick: onView },
        { label: 'Edit', icon: Pencil, onClick: onEdit },
        {
          label: statusAction,
          icon: isActive ? Ban : CheckCircle2,
          onClick: onToggleStatus,
        },
      ]}
    />
  )
}

export function ExamPatternTableActions({ row, onView, onEdit, onToggleStatus }) {
  return (
    <TestConfigActionMenu
      row={row}
      entityLabel="Instruction"
      onView={onView}
      onEdit={onEdit}
      onToggleStatus={onToggleStatus}
    />
  )
}

export function SectionManagementTableActions({ row, onView, onEdit, onToggleStatus }) {
  return (
    <TestConfigActionMenu
      row={row}
      entityLabel="Section"
      onView={onView}
      onEdit={onEdit}
      onToggleStatus={onToggleStatus}
    />
  )
}

export function LanguageSettingsTableActions({ row, onView, onEdit, onToggleStatus }) {
  return (
    <TestConfigActionMenu
      row={row}
      entityLabel="Language"
      onView={onView}
      onEdit={onEdit}
      onToggleStatus={onToggleStatus}
    />
  )
}

export { tableActionsCellClass }
