import { useState } from 'react'
import { PlusCircle, ScrollText, Ban, CheckCircle2, Trash2, Eye, Pencil } from 'lucide-react'
import RewardsPageShell from '../../../components/rewards/RewardsPageShell'
import AdminDataPanel from '../../../components/admin/AdminDataPanel'
import AdminStandardTable from '../../../components/admin/AdminStandardTable'
import CourseFilterToolbar from '../../../components/courses/CourseFilterToolbar'
import TableActionMenu from '../../../components/common/TableActionMenu'
import { StatusBadge } from '../../../components/academics/AcademicsUi'
import RewardRuleFormModal from '../../../components/rewards/RewardRuleFormModal'
import ViewRewardRuleModal from '../../../components/rewards/ViewRewardRuleModal'
import ConfirmRewardActionModal from '../../../components/rewards/ConfirmRewardActionModal'
import RewardsErrorState from '../../../components/rewards/RewardsErrorState'
import { useRewardRulesManagement } from '../../../hooks/useRewardRulesManagement'
import { getEventTypeLabel, formatCoins } from '../../../utils/rewardApiHelpers'
import { createRewardRule, deleteRewardRule, updateRewardRule } from '../../../services/rewardService'
import { RULE_STATUS } from '../../../constants/rewards'
import { getApiErrorMessage } from '../../../utils/apiError'
import { createActionsColumn } from '../../../utils/tableColumnHelpers'
import { ADMIN_CREATE_BTN } from '../../../utils/adminUiStandards'
import { toast } from '@/utils/toast'

function formatLimit(value) {
  if (value == null || value === '') return '—'
  return Number(value).toLocaleString()
}

export default function RewardRulesPage() {
  const { rules, loading, loadError, search, setSearch, statusFilter, setStatusFilter, refresh, patchRuleLocally, removeRuleLocally } =
    useRewardRulesManagement()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)

  const columns = [
    {
      key: 'name',
      label: 'Rule Name',
      headerClassName: 'min-w-[160px]',
      cellClassName: 'min-w-[160px] align-middle',
      render: (r) => <span className="font-semibold text-slate-900">{r.name}</span>,
    },
    {
      key: 'eventType',
      label: 'Event Type',
      headerClassName: 'min-w-[140px] whitespace-nowrap',
      cellClassName: 'min-w-[140px] whitespace-nowrap align-middle',
      render: (r) => <span className="font-medium text-[#111]">{getEventTypeLabel(r.eventType)}</span>,
    },
    {
      key: 'rewardValue',
      label: 'Reward Value',
      headerClassName: 'min-w-[120px] whitespace-nowrap',
      cellClassName: 'min-w-[120px] whitespace-nowrap align-middle',
      render: (r) => formatCoins(r.rewardValue),
    },
    {
      key: 'dailyLimit',
      label: 'Daily Limit',
      headerClassName: 'min-w-[100px] whitespace-nowrap',
      cellClassName: 'min-w-[100px] whitespace-nowrap align-middle',
      render: (r) => formatLimit(r.dailyLimit),
    },
    {
      key: 'monthlyLimit',
      label: 'Monthly Limit',
      headerClassName: 'min-w-[110px] whitespace-nowrap',
      cellClassName: 'min-w-[110px] whitespace-nowrap align-middle',
      render: (r) => formatLimit(r.monthlyLimit),
    },
    {
      key: 'expiryDays',
      label: 'Expiry Days',
      headerClassName: 'min-w-[100px] whitespace-nowrap',
      cellClassName: 'min-w-[100px] whitespace-nowrap align-middle',
      render: (r) => formatLimit(r.expiryDays),
    },
    {
      key: 'status',
      label: 'Status',
      headerClassName: 'min-w-[110px] whitespace-nowrap',
      cellClassName: 'min-w-[110px] align-middle',
      render: (r) => <StatusBadge status={r.status} />,
    },
    createActionsColumn({
      buttonCount: 1,
      render: (r) => {
        const isActive = r.status === RULE_STATUS.ACTIVE
        return (
          <TableActionMenu
            triggerLabel={`Actions for ${r.name}`}
            items={[
              {
                label: 'View',
                icon: Eye,
                onClick: () => setViewing(r),
              },
              {
                label: 'Edit',
                icon: Pencil,
                onClick: () => {
                  setEditing(r)
                  setModalOpen(true)
                },
              },
              {
                label: isActive ? 'Disable' : 'Enable',
                icon: isActive ? Ban : CheckCircle2,
                onClick: () => setStatusTarget(r),
              },
              {
                label: 'Deactivate',
                icon: Trash2,
                onClick: () => setDeleteTarget(r),
                danger: true,
              },
            ]}
          />
        )
      },
    }),
  ]

  const handleSubmit = async (form) => {
    setSubmitting(true)
    try {
      if (editing) {
        await updateRewardRule(editing.id, form)
        patchRuleLocally(editing.id, form)
        toast.success('Rule updated')
      } else {
        await createRewardRule(form)
        toast.success('Rule created')
      }
      setModalOpen(false)
      setEditing(null)
      await refresh()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save rule'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <RewardsPageShell
      icon={ScrollText}
      title="Reward Rules"
      actions={
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className={ADMIN_CREATE_BTN}
        >
          <PlusCircle className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          Add Rule
        </button>
      }
    >
      {loadError ? (
        <RewardsErrorState message={loadError} onRetry={refresh} />
      ) : (
        <AdminDataPanel
          toolbar={
            <CourseFilterToolbar
              search={search}
              onSearchChange={(e) => setSearch(e.target.value)}
              searchPlaceholder="Search rules by name, event type…"
              status={statusFilter}
              onStatusChange={(e) => setStatusFilter(e.target.value)}
              statusOptions={[
                { value: 'all', label: 'All Status' },
                { value: RULE_STATUS.ACTIVE, label: 'Active' },
                { value: RULE_STATUS.INACTIVE, label: 'Deactivated' },
              ]}
              disabled={loading && rules.length === 0}
            />
          }
        >
          <AdminStandardTable
            columns={columns}
            data={rules}
            loading={loading}
            stickyHeader
            itemLabel="rules"
            resetDeps={[search, statusFilter]}
            tableMinWidth={960}
          />
        </AdminDataPanel>
      )}
      <ViewRewardRuleModal open={Boolean(viewing)} rule={viewing} onClose={() => setViewing(null)} />
      <RewardRuleFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        initial={editing}
        onSubmit={handleSubmit}
        loading={submitting}
      />
      <ConfirmRewardActionModal
        open={Boolean(deleteTarget)}
        title="Deactivate"
        description={`Remove "${deleteTarget?.name}" permanently?`}
        confirmLabel="Deactivate"
        variant="danger"
        loading={submitting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          setSubmitting(true)
          try {
            await deleteRewardRule(deleteTarget.id)
            removeRuleLocally(deleteTarget.id)
            toast.success('Rule deleted')
            setDeleteTarget(null)
          } catch (error) {
            toast.error(getApiErrorMessage(error, 'Delete failed'))
          } finally {
            setSubmitting(false)
          }
        }}
      />
      <ConfirmRewardActionModal
        open={Boolean(statusTarget)}
        title="Update rule status?"
        description={`Toggle status for "${statusTarget?.name}"`}
        confirmLabel="Confirm"
        loading={submitting}
        onCancel={() => setStatusTarget(null)}
        onConfirm={async () => {
          const next = statusTarget.status === RULE_STATUS.ACTIVE ? RULE_STATUS.INACTIVE : RULE_STATUS.ACTIVE
          setSubmitting(true)
          try {
            await updateRewardRule(statusTarget.id, { status: next })
            patchRuleLocally(statusTarget.id, { status: next })
            toast.success('Status updated')
            setStatusTarget(null)
          } catch (error) {
            toast.error(getApiErrorMessage(error, 'Update failed'))
          } finally {
            setSubmitting(false)
          }
        }}
      />
    </RewardsPageShell>
  )
}
