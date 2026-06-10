import { useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, Trash2, Scale, CheckCircle, XCircle } from 'lucide-react'
import { toast } from '@/utils/toast'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import { BannerButton, StatusBadge } from '../../academics/AcademicsUi'
import TableActionMenu from '../../common/TableActionMenu'
import StatCard from '../../dashboard/StatCard'
import ConfirmDeleteDialog from '../../subjects/ConfirmDeleteDialog'
import { useEditModal } from '../../../hooks/useEditModal'
import { deleteMarkingRule, fetchMarkingRules, upsertMarkingRule } from '../../../api/testConfigurationAPI'
import ConfigFilterToolbar from '../ConfigFilterToolbar'
import ConfigViewModal from '../ConfigViewModal'
import MarkingRuleFormModal from './MarkingRuleFormModal'

export default function MarkingRulesTab() {
  const modal = useEditModal()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [viewRow, setViewRow] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteRow, setDeleteRow] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const reload = async () => {
    setLoading(true)
    try {
      const list = await fetchMarkingRules({ search, status, sortBy: 'createdAt' })
      setRows(list || [])
    } catch (err) {
      toast.error(err?.message || 'Failed to load marking rules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status])

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status === 'Active').length
    const partial = rows.filter((r) => r.partialMarking).length
    return { total: rows.length, active, partial }
  }, [rows])

  const handleSave = async (form, meta) => {
    const saved = await upsertMarkingRule(form, meta)
    setRows((prev) => {
      if (meta.isEdit) {
        return prev.map((r) => (String(r.id) === String(meta.id) ? { ...r, ...saved } : r))
      }
      return [saved, ...prev]
    })
  }

  const handleDelete = async () => {
    if (!deleteRow) return
    setDeleting(true)
    try {
      await deleteMarkingRule(deleteRow.id)
      setRows((prev) => prev.filter((r) => String(r.id) !== String(deleteRow.id)))
      toast.success('Marking rule deleted')
      setDeleteOpen(false)
      setDeleteRow(null)
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: 'id', label: 'Rule ID', headerClassName: 'pl-6 sm:pl-10', cellClassName: 'pl-6 sm:pl-10' },
    {
      key: 'ruleName',
      label: 'Rule Name',
      render: (r) => <span className="font-medium text-[#1a3a5c]">{r.ruleName}</span>,
    },
    { key: 'positiveMarks', label: 'Positive Marks', render: (r) => `+${r.positiveMarks}` },
    {
      key: 'negativeMarks',
      label: 'Negative Marks',
      render: (r) => (Number(r.negativeMarks) > 0 ? `-${r.negativeMarks}` : '0'),
    },
    {
      key: 'partialMarking',
      label: 'Partial Marking',
      render: (r) => (r.partialMarking ? `Yes (${r.partialMarksValue})` : 'No'),
    },
    {
      key: 'applicableTests',
      label: 'Applicable Tests',
      render: (r) => (Array.isArray(r.applicableTests) ? r.applicableTests.join(', ') : '—'),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <TableActionMenu
          triggerLabel="Marking rule actions"
          items={[
            { label: 'View', icon: Eye, onClick: () => setViewRow(row) },
            { label: 'Edit', icon: Pencil, onClick: () => modal.openEdit(row) },
            {
              label: 'Delete',
              icon: Trash2,
              danger: true,
              onClick: () => {
                setDeleteRow(row)
                setDeleteOpen(true)
              },
            },
          ]}
        />
      ),
    },
  ]

  const viewFields = [
    { key: 'id', label: 'Rule ID' },
    { key: 'ruleName', label: 'Rule Name' },
    { key: 'positiveMarks', label: 'Positive Marks', render: (r) => `+${r.positiveMarks}` },
    {
      key: 'negativeMarks',
      label: 'Negative Marks',
      render: (r) => (Number(r.negativeMarks) > 0 ? `-${r.negativeMarks}` : 'None'),
    },
    {
      key: 'partialMarking',
      label: 'Partial Marking',
      render: (r) => (r.partialMarking ? `Enabled (${r.partialMarksValue})` : 'Disabled'),
    },
    {
      key: 'applicableTests',
      label: 'Applicable Test Types',
      render: (r) => (Array.isArray(r.applicableTests) ? r.applicableTests.join(', ') : '—'),
    },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created Date' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#555]">Manage positive, negative, and partial marking rules for tests.</p>
        <BannerButton onClick={modal.openCreate}>Add Rule</BannerButton>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard title="Total Rules" value={stats.total} color="#55ace7" icon={Scale} />
        <StatCard title="Active" value={stats.active} color="#69df66" icon={CheckCircle} />
        <StatCard title="Partial Marking" value={stats.partial} color="#1a3a5c" icon={Scale} />
      </div>

      <ConfigFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by rule name…"
        status={status}
        onStatusChange={setStatus}
      />

      <PaginatedFigmaTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyMessage="No marking rules found."
        itemLabel="rules"
        resetDeps={[search, status]}
        rowClassName="hover:bg-slate-50/90"
        stickyHeader
        stickyLastColumn
        zebraStriping
      />

      <MarkingRuleFormModal
        open={modal.isOpen}
        onClose={modal.close}
        item={modal.selectedItem}
        existingRows={rows}
        onSubmit={handleSave}
      />

      <ConfigViewModal
        open={Boolean(viewRow)}
        onClose={() => setViewRow(null)}
        title="View Marking Rule"
        row={viewRow}
        fields={viewFields}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Delete marking rule?"
        message="Are you sure you want to delete this?"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteOpen(false)
          setDeleteRow(null)
        }}
        loading={deleting}
      />
    </div>
  )
}
