import { useMemo, useState } from 'react'
import { Plus, Settings2, Layers } from 'lucide-react'
import FinanceSettingsPanelShell from './FinanceSettingsPanelShell'
import FinanceConfirmDialog from './FinanceConfirmDialog'
import FinancePaymentModeCard from './FinancePaymentModeCard'
import FinancePaymentModeDialog from './FinancePaymentModeDialog'
import FinanceModeFilters from './FinanceModeFilters'
import { FinanceSettingsSection } from './FinanceSettingsHeader'
import FinanceEmptyState from './FinanceEmptyState'
import { updatePaymentModeSettings } from '../../api/financeAPI'
import { FINANCE_CRITICAL_PAYMENT_MODE_IDS } from '../../constants/financeConstants'
import {
  createPaymentModeFromForm,
  filterAndSortPaymentModes,
  groupPaymentModesByCategory,
} from '../../utils/finance/paymentModeUtils'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

export default function FinancePaymentModeManager({
  settings = [],
  onUpdated,
  canManage = true,
  readOnly = false,
  className,
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState([])
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [formOpen, setFormOpen] = useState(false)
  const [editingMode, setEditingMode] = useState(null)
  const [confirmDisable, setConfirmDisable] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  if (!canManage) return null

  const enabledCount = settings.filter((m) => m.enabled).length
  const canEdit = !readOnly

  const openManager = () => {
    setDraft(JSON.parse(JSON.stringify(settings)))
    setSearch('')
    setCategoryFilter('all')
    setStatusFilter('all')
    setSortBy('name')
    setOpen(true)
  }

  const closeManager = () => {
    if (saving) return
    setOpen(false)
    setFormOpen(false)
    setEditingMode(null)
  }

  const filteredModes = useMemo(
    () =>
      filterAndSortPaymentModes(draft, {
        search,
        category: categoryFilter,
        status: statusFilter,
        sort: sortBy,
      }),
    [draft, search, categoryFilter, statusFilter, sortBy],
  )

  const groupedModes = useMemo(() => groupPaymentModesByCategory(filteredModes), [filteredModes])

  const persistSettings = async (nextDraft) => {
    setSaving(true)
    try {
      const updated = await updatePaymentModeSettings(nextDraft)
      setDraft(updated)
      onUpdated?.(updated)
    } catch {
      toast.error('Failed to save payment mode settings')
      throw new Error('save failed')
    } finally {
      setSaving(false)
    }
  }

  const applyToggle = async (mode, enabled) => {
    if (!canEdit) return
    const nextDraft = draft.map((m) =>
      m.id === mode.id ? { ...m, enabled, lastUpdated: new Date().toISOString() } : m,
    )
    setDraft(nextDraft)
    try {
      await persistSettings(nextDraft)
      toast.success(enabled ? `"${mode.label}" enabled` : `"${mode.label}" disabled`)
    } catch {
      setDraft(settings)
    }
  }

  const handleToggle = (mode) => {
    if (!canEdit || saving) return
    if (mode.enabled && FINANCE_CRITICAL_PAYMENT_MODE_IDS.includes(mode.id)) {
      setConfirmDisable(mode)
      return
    }
    applyToggle(mode, !mode.enabled)
  }

  const handleFormSubmit = async (form, existing) => {
    if (!canEdit || saving) return
    const now = new Date().toISOString()
    let nextDraft
    if (existing) {
      nextDraft = draft.map((m) =>
        m.id === existing.id
          ? {
              ...m,
              label: form.label.trim(),
              category: form.category,
              description: form.description?.trim() || '',
              icon: form.icon,
              enabled: form.enabled !== false,
              lastUpdated: now,
            }
          : m,
      )
    } else {
      nextDraft = [...draft, createPaymentModeFromForm(form)]
    }
    setDraft(nextDraft)
    try {
      await persistSettings(nextDraft)
      toast.success(existing ? `"${form.label.trim()}" updated` : `"${form.label.trim()}" added`)
      setFormOpen(false)
      setEditingMode(null)
    } catch {
      setDraft(settings)
    }
  }

  const handleDelete = (mode) => {
    if (!canEdit) return
    if (!mode.isCustom) {
      toast.error('Built-in payment modes cannot be deleted. Disable instead.')
      return
    }
    setConfirmDelete(mode)
  }

  const activeCount = draft.filter((m) => m.enabled).length
  const inactiveCount = draft.filter((m) => !m.enabled).length

  return (
    <>
      <button
        type="button"
        onClick={openManager}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-lg border border-[#55ace7]/40 bg-white px-3 text-sm font-semibold text-[#246392] transition hover:bg-[#eef6fc]',
          className,
        )}
      >
        <Settings2 className="h-4 w-4" />
        <span className="hidden sm:inline">Payment Modes</span>
        <span className="rounded-full bg-[#246392] px-2 py-0.5 text-xs font-bold text-white">
          {enabledCount}/{settings.length || 8}
        </span>
      </button>

      <FinanceSettingsPanelShell
        open={open}
        onClose={closeManager}
        size="lg"
        className="sm:max-w-2xl"
        title="Payment Mode Management"
        subtitle="Enable, disable, or add payment methods for filters and workflows."
        icon={Settings2}
      >
        <div className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Active', value: activeCount },
                { label: 'Deactivated', value: inactiveCount },
                { label: 'Total', value: draft.length },
              ].map((stat) => (
                <span
                  key={stat.label}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#246392] shadow-sm ring-1 ring-slate-200/80"
                >
                  <span className="tabular-nums">{stat.value}</span>
                  <span className="text-[#686868]">{stat.label}</span>
                </span>
              ))}
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setEditingMode(null)
                  setFormOpen(true)
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#246392] px-3 text-xs font-semibold text-white hover:bg-[#1a3a5c] sm:text-sm"
              >
                <Plus className="h-4 w-4" />
                Add mode
              </button>
            )}
          </div>

          <FinanceModeFilters
            search={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            category={categoryFilter}
            onCategoryChange={(e) => setCategoryFilter(e.target.value)}
            status={statusFilter}
            onStatusChange={(e) => setStatusFilter(e.target.value)}
            sort={sortBy}
            onSortChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200/80"
          />

          {readOnly && (
            <p className="rounded-lg bg-white px-3 py-2 text-xs text-[#686868] ring-1 ring-slate-200/80">
              View-only access — contact a finance admin to change payment modes.
            </p>
          )}

          {filteredModes.length === 0 ? (
            <FinanceEmptyState
              icon={Layers}
              title="No payment modes found"
              description="Try adjusting search or filters, or add a new payment mode."
              ctaLabel="Clear filters"
              onCta={() => {
                setSearch('')
                setCategoryFilter('all')
                setStatusFilter('all')
              }}
              className="py-8"
            />
          ) : (
            <div className="space-y-4">
              {groupedModes.map(({ category, modes }) => (
                <FinanceSettingsSection key={category.id} title={category.label} count={modes.length}>
                  {modes.map((mode) => (
                    <FinancePaymentModeCard
                      key={mode.id}
                      mode={mode}
                      onToggle={canEdit ? handleToggle : undefined}
                      onEdit={
                        canEdit
                          ? (m) => {
                              setEditingMode(m)
                              setFormOpen(true)
                            }
                          : undefined
                      }
                      onDelete={canEdit ? handleDelete : undefined}
                      canDelete={canEdit && !!mode.isCustom}
                    />
                  ))}
                </FinanceSettingsSection>
              ))}
            </div>
          )}
        </div>
      </FinanceSettingsPanelShell>

      <FinancePaymentModeDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingMode(null)
        }}
        mode={editingMode}
        existingModes={draft}
        onSubmit={handleFormSubmit}
        readOnly={readOnly}
      />

      <FinanceConfirmDialog
        open={!!confirmDisable}
        title="Disable critical payment mode?"
        message={
          confirmDisable
            ? `"${confirmDisable.label}" is a core payment method. Disabling it will remove it from payment workflows and filters until re-enabled.`
            : ''
        }
        confirmLabel="Disable mode"
        variant="danger"
        onConfirm={() => {
          if (confirmDisable) void applyToggle(confirmDisable, false)
          setConfirmDisable(null)
        }}
        onCancel={() => setConfirmDisable(null)}
      />

      <FinanceConfirmDialog
        open={!!confirmDelete}
        title="Deactivate"
        message={
          confirmDelete
            ? `Permanently remove "${confirmDelete.label}"? This cannot be undone.`
            : ''
        }
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={async () => {
          if (!confirmDelete || saving) {
            setConfirmDelete(null)
            return
          }
          const nextDraft = draft.filter((m) => m.id !== confirmDelete.id)
          setDraft(nextDraft)
          try {
            await persistSettings(nextDraft)
            toast.success(`"${confirmDelete.label}" removed`)
          } catch {
            setDraft(settings)
          }
          setConfirmDelete(null)
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  )
}
