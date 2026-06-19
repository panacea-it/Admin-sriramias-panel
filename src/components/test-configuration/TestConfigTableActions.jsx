import { RefreshCw } from 'lucide-react'
import ViewButton from '../common/ViewButton'
import EditButton from '../common/EditButton'
import IconActionButton from '../common/IconActionButton'
import { recordStatusActionLabel } from '../../constants/recordStatus'
import { cn } from '../../utils/cn'
import {
  createActionsColumn,
  TABLE_ACTIONS_WRAP_CENTER,
} from '../../utils/tableColumnHelpers'

export const testConfigTablePaginationClass = cn(
  '[&>div:last-child]:items-center',
  '[&_nav]:items-center',
  '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
  '[&_form_input]:h-9 [&_form_input]:leading-none',
  '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
)

export const testConfigTableProps = {
  density: 'compact',
  tableLayoutFixed: true,
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
    buttonCount: 3,
    align: 'center',
    render,
  })
}

function isRowActive(status) {
  return String(status || '').trim().toLowerCase() === 'active'
}

function TestConfigInlineActions({ isActive, onView, onEdit, onToggleStatus, onDelete: _onDelete }) {
  const statusAction = recordStatusActionLabel(isActive ? 'Active' : 'In Active')

  return (
    <div className={TABLE_ACTIONS_WRAP_CENTER}>
      <ViewButton onClick={onView} label="View" />
      <EditButton onClick={onEdit} label="Edit" />
      <IconActionButton
        label={statusAction}
        onClick={onToggleStatus}
        className="text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm"
      >
        <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
      </IconActionButton>
    </div>
  )
}

export function ExamPatternTableActions({ row, onView, onEdit, onToggleStatus, onDelete }) {
  return (
    <TestConfigInlineActions
      isActive={isRowActive(row.status)}
      onView={onView}
      onEdit={onEdit}
      onToggleStatus={onToggleStatus}
      onDelete={onDelete}
    />
  )
}

export function SectionManagementTableActions({ row, onView, onEdit, onToggleStatus, onDelete }) {
  return (
    <TestConfigInlineActions
      isActive={isRowActive(row.status)}
      onView={onView}
      onEdit={onEdit}
      onToggleStatus={onToggleStatus}
      onDelete={onDelete}
    />
  )
}

export function LanguageSettingsTableActions({ row, onView, onEdit, onToggleStatus, onDelete }) {
  return (
    <TestConfigInlineActions
      isActive={isRowActive(row.status)}
      onView={onView}
      onEdit={onEdit}
      onToggleStatus={onToggleStatus}
      onDelete={onDelete}
    />
  )
}
