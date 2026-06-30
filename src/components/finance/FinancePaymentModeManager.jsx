import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Settings2, Layers } from 'lucide-react'
import FinanceSettingsPanelShell from './FinanceSettingsPanelShell'
import FinanceConfirmDialog from './FinanceConfirmDialog'
import FinancePaymentModeCard from './FinancePaymentModeCard'
import FinancePaymentModeDialog from './FinancePaymentModeDialog'
import FinanceModeFilters from './FinanceModeFilters'
import { FinanceSettingsSection } from './FinanceSettingsHeader'
import FinanceEmptyState from './FinanceEmptyState'
import {
  changePaymentModeStatus,
  createPaymentMode,
  deletePaymentMode,
  fetchPaymentModesList,
  updatePaymentMode,
} from '../../api/paymentModesAPI'
import { FINANCE_CRITICAL_PAYMENT_MODE_IDS } from '../../constants/financeConstants'
import {
  filterAndSortPaymentModes,
  groupPaymentModesByCategory,
} from '../../utils/finance/paymentModeUtils'
import { mapApiCategoryToUi, mapApiIconToUi } from '../../utils/studentPaymentReportsHelpers'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

function mapApiGroupsToSections(groups = []) {
  return groups
    .map((group) => {
      const categoryId = mapApiCategoryToUi(group.category)
      const modes = (group.items || []).map((item) => ({
        id: item.paymentModeId,
        paymentModeId: item.paymentModeId,
        label: item.paymentModeName,
        category: categoryId,
        description: item.description || '',
        icon: mapApiIconToUi(item.icon),
        enabled: item.isActive !== false,
        isCustom: true,
        lastUpdated: item.updatedAt,
        _id: item._id,
      }))
      return { categoryId, count: group.count ?? modes.length, modes }
    })
    .filter((section) => section.modes.length > 0)
}

export default function FinancePaymentModeManager({
  badgeSummary = { activeCount: 0, totalCount: 0 },
  onModesChanged,
  canManage = true,
  readOnly = false,
  className,
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState([])
  const [summary, setSummary] = useState(badgeSummary)
  const [apiGroups, setApiGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [formOpen, setFormOpen] = useState(false)
  const [editingMode, setEditingMode] = useState(null)
  const [confirmDisable, setConfirmDisable] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const canEdit = !readOnly

  useEffect(() => {
    setSummary(badgeSummary)
  }, [badgeSummary])

  const loadModes = useCallback(
    async (filters = {}) => {
      setLoading(true)
      try {
        const result = await fetchPaymentModesList({
          search: filters.search ?? debouncedSearch,
          category: filters.category ?? categoryFilter,
          status: filters.status ?? statusFilter,
          sort: filters.sort ?? sortBy,
        })
        setDraft(result.items || [])
        setApiGroups(result.groups || [])
        setSummary(result.summary || badgeSummary)
        return result
      } catch (error) {
        toast.error(error.message || 'Failed to load payment modes')
        throw error
      } finally {
        setLoading(false)
      }
    },
    [debouncedSearch, categoryFilter, statusFilter, sortBy, badgeSummary],
  )

  const openManager = () => {
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

  useEffect(() => {
    if (!open) return
    loadModes().catch(() => {})
  }, [open, debouncedSearch, categoryFilter, statusFilter, sortBy, loadModes])

  const filteredModes = useMemo(
    () =>
      filterAndSortPaymentModes(draft, {
        search: '',
        category: 'all',
        status: 'all',
        sort: sortBy,
      }),
    [draft, sortBy],
  )

  const groupedModes = useMemo(() => {
    if (apiGroups.length > 0) {
      return mapApiGroupsToSections(apiGroups).map((section) => ({
        category: {
          id: section.categoryId,
          label: section.categoryId.charAt(0).toUpperCase() + section.categoryId.slice(1),
        },
        modes: section.modes,
      }))
    }
    return groupPaymentModesByCategory(filteredModes)
  }, [apiGroups, filteredModes])

  const applyToggle = async (mode, enabled) => {
    if (!canEdit) return
    setSaving(true)
    try {
      await changePaymentModeStatus(mode.paymentModeId || mode.id, enabled)
      await loadModes()
      onModesChanged?.()
      toast.success(enabled ? `"${mode.label}" enabled` : `"${mode.label}" disabled`)
    } catch (error) {
      if (error.status === 403) {
        toast.error('Access denied')
      } else {
        toast.error(error.message || 'Failed to update payment mode')
      }
    } finally {
      setSaving(false)
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
    setSaving(true)
    try {
      if (existing) {
        await updatePaymentMode(form, existing)
        toast.success(`"${form.label.trim()}" updated`)
      } else {
        await createPaymentMode(form)
        toast.success(`"${form.label.trim()}" added`)
      }
      setFormOpen(false)
      setEditingMode(null)
      await loadModes()
      onModesChanged?.()
    } catch (error) {
      if (error.status === 403) {
        toast.error('Access denied')
      } else {
        toast.error(error.message || 'Failed to save payment mode')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (mode) => {
    if (!canEdit) return
    setConfirmDelete(mode)
  }

  const activeCount = summary.activeCount ?? draft.filter((m) => m.enabled).length
  const inactiveCount = summary.inactiveCount ?? draft.filter((m) => !m.enabled).length
  const totalCount = summary.totalCount ?? draft.length
  const badgeActive = badgeSummary.activeCount ?? activeCount
  const badgeTotal = badgeSummary.totalCount ?? totalCount

  if (!canManage) return null

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
          {badgeActive}/{badgeTotal || 8}
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
                { label: 'Total', value: totalCount },
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

          {loading ? (
            <p className="py-8 text-center text-sm text-[#686868]">Loading payment modes…</p>
          ) : filteredModes.length === 0 ? (
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
                      canDelete={canEdit}
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
          setSaving(true)
          try {
            await deletePaymentMode(confirmDelete.paymentModeId || confirmDelete.id)
            toast.success(`"${confirmDelete.label}" removed`)
            await loadModes()
            onModesChanged?.()
          } catch (error) {
            if (error.status === 403) {
              toast.error('Access denied')
            } else {
              toast.error(error.message || 'Failed to delete payment mode')
            }
          } finally {
            setSaving(false)
          }
          setConfirmDelete(null)
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  )
}
