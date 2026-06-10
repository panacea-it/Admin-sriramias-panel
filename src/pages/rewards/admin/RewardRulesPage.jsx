import { useState } from 'react'
import { PlusCircle, ScrollText } from 'lucide-react'
import RewardsPageShell from '../../../components/rewards/RewardsPageShell'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import CourseFilterToolbar from '../../../components/courses/CourseFilterToolbar'
import EditButton from '../../../components/common/EditButton'
import { StatusBadge } from '../../../components/academics/AcademicsUi'
import RewardRuleFormModal from '../../../components/rewards/RewardRuleFormModal'
import ConfirmRewardActionModal from '../../../components/rewards/ConfirmRewardActionModal'
import RewardsErrorState from '../../../components/rewards/RewardsErrorState'
import { useRewardRulesManagement } from '../../../hooks/useRewardRulesManagement'
import { getEventTypeLabel, formatCoins } from '../../../utils/rewardApiHelpers'
import { createRewardRule, deleteRewardRule, updateRewardRule } from '../../../services/rewardService'
import { RULE_STATUS } from '../../../constants/rewards'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '@/utils/toast'

export default function RewardRulesPage() {
  const { rules, loading, loadError, search, setSearch, statusFilter, setStatusFilter, refresh, patchRuleLocally, removeRuleLocally } =
    useRewardRulesManagement()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)

  const columns = [
    { key: 'name', label: 'Rule Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'eventType', label: 'Event Type', render: (r) => getEventTypeLabel(r.eventType) },
    { key: 'rewardValue', label: 'Reward Value', render: (r) => formatCoins(r.rewardValue) },
    { key: 'dailyLimit', label: 'Daily Limit' },
    { key: 'monthlyLimit', label: 'Monthly Limit' },
    { key: 'expiryDays', label: 'Expiry Days' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex flex-wrap gap-2">
          <EditButton onClick={() => { setEditing(r); setModalOpen(true) }} />
          <button type="button" className="text-xs font-semibold text-amber-700" onClick={() => setStatusTarget(r)}>
            {r.status === RULE_STATUS.ACTIVE ? 'Disable' : 'Enable'}
          </button>
          <button type="button" className="text-xs font-semibold text-rose-600" onClick={() => setDeleteTarget(r)}>
            Delete
          </button>
        </div>
      ),
    },
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
        <button type="button" onClick={() => { setEditing(null); setModalOpen(true) }} className={addBtn}>
          <PlusCircle className="h-4 w-4" />
          Add Rule
        </button>
      }
    >
      <CourseFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search rules…"
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All Status' },
              { value: RULE_STATUS.ACTIVE, label: 'Active' },
              { value: RULE_STATUS.INACTIVE, label: 'Inactive' },
            ],
          },
        ]}
      />
      {loadError ? (
        <RewardsErrorState message={loadError} onRetry={refresh} />
      ) : (
        <PaginatedFigmaTable columns={columns} data={rules} loading={loading} stickyHeader />
      )}
      <RewardRuleFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} initial={editing} onSubmit={handleSubmit} loading={submitting} />
      <ConfirmRewardActionModal
        open={Boolean(deleteTarget)}
        title="Delete rule?"
        description={`Remove "${deleteTarget?.name}" permanently?`}
        confirmLabel="Delete"
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

const addBtn =
  'inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-4 text-sm font-semibold text-white shadow-md'
