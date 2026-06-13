import { Ban, Eye, Pencil, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'

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

function TestConfigInlineActions({ label, isActive, onView, onEdit, onToggleStatus, onDelete }) {
  return (
    <div className="flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5">
      <button
        type="button"
        onClick={onView}
        title="View"
        aria-label={`View ${label}`}
        className={cn(testConfigActionButtonClass, 'text-slate-500 hover:bg-slate-100 hover:text-[#246392]')}
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">View</span>
      </button>
      <button
        type="button"
        onClick={onEdit}
        title="Edit"
        aria-label={`Edit ${label}`}
        className={cn(testConfigActionButtonClass, 'text-slate-500 hover:bg-slate-100 hover:text-[#246392]')}
      >
        <Pencil className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Edit</span>
      </button>
      <button
        type="button"
        onClick={onToggleStatus}
        title={isActive ? 'Disable' : 'Enable'}
        aria-label={isActive ? `Disable ${label}` : `Enable ${label}`}
        className={cn(testConfigActionButtonClass, 'text-amber-700 hover:bg-amber-50')}
      >
        <Ban className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">{isActive ? 'Disable' : 'Enable'}</span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        title="Delete"
        aria-label={`Delete ${label}`}
        className={cn(testConfigActionButtonClass, 'text-red-600 hover:bg-red-50')}
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Delete</span>
      </button>
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
