import { RefreshCw } from 'lucide-react'
import ViewButton from '../common/ViewButton'
import EditButton from '../common/EditButton'
import IconActionButton from '../common/IconActionButton'
import { recordStatusActionLabel } from '../../constants/recordStatus'
import { cn } from '../../utils/cn'
import { TABLE_ACTIONS_WRAP } from '../../utils/tableColumnHelpers'

/** Matches Center Management `actionButtonClass` exactly. */
export const testConfigActionButtonClass =
  'inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition sm:min-w-0 sm:px-2.5'

export const testConfigActionsColumn = {
  align: 'right',
  headerClassName: 'min-w-[280px] whitespace-nowrap pr-4 sm:pr-6',
  cellClassName: 'min-w-[280px] whitespace-nowrap align-middle pr-4 sm:pr-6',
}

export const testConfigActionsColumnWide = testConfigActionsColumn

export const testConfigTablePaginationClass = cn(
  '[&>div:last-child]:items-center',
  '[&_nav]:items-center',
  '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
  '[&_form_input]:h-9 [&_form_input]:leading-none',
  '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
)

function isRowActive(status) {
  return String(status || '').trim().toLowerCase() === 'active'
}

function TestConfigInlineActions({ label, isActive, onView, onEdit, onToggleStatus, onDelete: _onDelete }) {
  const statusAction = recordStatusActionLabel(isActive ? 'Active' : 'In Active')

  return (
    <div className={TABLE_ACTIONS_WRAP}>
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
  const label = row.instructionId || row.id || 'instruction'

  return (
    <TestConfigInlineActions
      label={label}
      isActive={isRowActive(row.status)}
      onView={onView}
      onEdit={onEdit}
      onToggleStatus={onToggleStatus}
      onDelete={onDelete}
    />
  )
}

export function SectionManagementTableActions({ row, onView, onEdit, onToggleStatus, onDelete }) {
  const label = row.sectionName || row.configurationName || row.id || 'section'

  return (
    <TestConfigInlineActions
      label={label}
      isActive={isRowActive(row.status)}
      onView={onView}
      onEdit={onEdit}
      onToggleStatus={onToggleStatus}
      onDelete={onDelete}
    />
  )
}

export function LanguageSettingsTableActions({ row, onView, onEdit, onToggleStatus, onDelete }) {
  const label = row.languageName || row.id || 'language'

  return (
    <TestConfigInlineActions
      label={label}
      isActive={isRowActive(row.status)}
      onView={onView}
      onEdit={onEdit}
      onToggleStatus={onToggleStatus}
      onDelete={onDelete}
    />
  )
}
