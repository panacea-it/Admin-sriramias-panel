import { useMemo, useState } from 'react'
import { FileText, PlusCircle, Search, ChevronDown } from 'lucide-react'
import PageBanner from '../figma/PageBanner'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import WebsiteFormModal from './WebsiteFormModal'
import WebsiteFormShell from './WebsiteFormShell'
import ToppersListFormFields from './ToppersListFormFields'
import WebsiteRecordRowActions from './WebsiteRecordRowActions'
import AdminConfirmModal from '../admin/AdminConfirmModal'
import { createActionsColumn } from '../../utils/tableColumnHelpers'
import { WebsiteStatusBadge } from './websiteUi'
import {
  TOPPERS_LIST_STATUS,
  TOPPERS_LIST_STATUS_OPTIONS,
  TOPPER_YEAR_OPTIONS,
  emptyToppersListForm,
} from '../../constants/toppersListConstants'
import {
  buildToppersListFormData,
  formFromApiToppersList,
  mapApiToppersListsToRows,
} from '../../utils/toppersListApiHelpers'
import {
  useChangeToppersListStatus,
  useCreateToppersList,
  useDeleteToppersList,
  useToppersLists,
  useUpdateToppersList,
} from '../../hooks/useToppersList'
import { getApiErrorMessage } from '../../utils/apiError'
import { toast } from '@/utils/toast'
import { cn } from '../../utils/cn'
import { displayRecordStatusLabel } from '../../constants/recordStatus'

function formatCreatedOn(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function validateToppersListForm(form, rows, editTarget) {
  const errors = {}
  if (!String(form.title || '').trim()) errors.title = 'Title is required'
  if (!String(form.year || '').trim()) errors.year = 'Year is required'
  if (!String(form.displayOrder || '').trim()) errors.displayOrder = 'Display order is required'
  if (!editTarget && !(form.pdfFile instanceof File)) {
    errors.pdfFile = 'PDF file is required'
  }
  if (editTarget && !(form.pdfFile instanceof File) && !editTarget?.pdfFile?.url) {
    errors.pdfFile = 'PDF file is required'
  }

  const year = Number(form.year)
  const displayOrder = Number(form.displayOrder)
  const duplicateOrder = rows.some(
    (row) => row.displayOrder === displayOrder && row.id !== editTarget?.id,
  )

  if (duplicateOrder) errors.displayOrder = 'Display order must be unique'

  return errors
}

export default function ToppersListTab() {
  const { data: apiRows = [], isLoading } = useToppersLists()
  const createMutation = useCreateToppersList()
  const updateMutation = useUpdateToppersList()
  const statusMutation = useChangeToppersListStatus()
  const deleteMutation = useDeleteToppersList()

  const rows = useMemo(() => mapApiToppersListsToRows(apiRows), [apiRows])
  const saving = createMutation.isPending || updateMutation.isPending
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [viewTarget, setViewTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyToppersListForm)
  const [formErrors, setFormErrors] = useState({})

  const clearFieldError = (field) => {
    if (!formErrors[field]) return
    setFormErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows
      .filter((row) => {
        const matchSearch =
          !q ||
          row.toppersListId.toLowerCase().includes(q) ||
          row.title.toLowerCase().includes(q) ||
          String(row.year).includes(q) ||
          String(row.pdfFile?.fileName || '').toLowerCase().includes(q)
        const matchYear = yearFilter === 'all' || String(row.year) === yearFilter
        const matchStatus = statusFilter === 'all' || row.status === statusFilter
        return matchSearch && matchYear && matchStatus
      })
      .sort((a, b) => a.displayOrder - b.displayOrder)
  }, [rows, search, yearFilter, statusFilter])

  const openAdd = () => {
    setEditTarget(null)
    setForm(emptyToppersListForm())
    setFormErrors({})
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setEditTarget(row)
    setForm(formFromApiToppersList(row))
    setFormErrors({})
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditTarget(null)
    setFormErrors({})
  }

  const handleSave = async () => {
    const errors = validateToppersListForm(form, rows, editTarget)
    if (Object.keys(errors).length) {
      setFormErrors(errors)
      return
    }

    try {
      const includePdf = form.pdfFile instanceof File
      const formData = buildToppersListFormData(form, { includePdf })

      if (editTarget) {
        await updateMutation.mutateAsync({
          id: editTarget.id,
          formData,
        })
        toast.success('Toppers list updated')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Toppers list created')
      }
      closeForm()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save toppers list'))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('Toppers list deleted')
      setDeleteTarget(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete toppers list'))
    }
  }

  const handleStatusToggle = async (row) => {
    const nextStatus =
      row.status === TOPPERS_LIST_STATUS.ACTIVE
        ? TOPPERS_LIST_STATUS.INACTIVE
        : TOPPERS_LIST_STATUS.ACTIVE

    try {
      await statusMutation.mutateAsync({ id: row.id, status: nextStatus })
      toast.success('Status updated')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update status'))
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'order',
        label: 'Order',
        width: 72,
        align: 'center',
        render: (row) => (
          <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-[#eef6fc] px-2 py-0.5 text-xs font-bold text-[#246392] ring-1 ring-[#55ace7]/20">
            {row.displayOrder}
          </span>
        ),
      },
      {
        key: 'year',
        label: 'Year',
        width: 80,
        align: 'center',
        render: (row) => (
          <span className="text-sm font-bold text-[#246392]">{row.year}</span>
        ),
      },
      {
        key: 'title',
        label: 'Title',
        headerClassName: 'min-w-[180px]',
        render: (row) => (
          <div className="min-w-0">
            <p className="truncate font-semibold text-[#14213D]">{row.title}</p>
            <p className="truncate text-xs text-[#667085]">{row.toppersListId}</p>
          </div>
        ),
      },
      {
        key: 'pdf',
        label: 'PDF File',
        headerClassName: 'min-w-[160px]',
        render: (row) => (
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#fef2f2] text-[#dc2626]">
              <FileText className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="truncate text-sm text-[#686868]">
              {row.pdfFile?.fileName || '—'}
            </span>
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: 100,
        align: 'center',
        render: (row) => (
          <WebsiteStatusBadge status={displayRecordStatusLabel(row.status)} />
        ),
      },
      {
        key: 'created',
        label: 'Created',
        width: 104,
        render: (row) => (
          <span className="whitespace-nowrap text-[13px] font-medium text-[#686868]">
            {formatCreatedOn(row.createdAt)}
          </span>
        ),
      },
      createActionsColumn({
        buttonCount: 3,
        align: 'right',
        render: (row) => (
          <WebsiteRecordRowActions
            rowName={row.title}
            status={row.status}
            onView={() => setViewTarget(row)}
            onEdit={() => openEdit(row)}
            onStatusToggle={() => handleStatusToggle(row)}
          />
        ),
      }),
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageBanner
        icon={FileText}
        title="Toppers List"
        subtitle="Manage year-wise toppers list PDFs shown on Our Toppers Gallery"
      >
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-white/95"
        >
          <PlusCircle className="h-4 w-4" strokeWidth={2.2} />
          Add Toppers List
        </button>
      </PageBanner>

      <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-[#14213D]">Year-wise PDF Lists</h3>
          <span className="rounded-full bg-[#eef6fc] px-3 py-1 text-xs font-semibold text-[#246392]">
            {filteredRows.length} record{filteredRows.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="mb-4 flex min-h-[56px] flex-wrap items-center justify-between gap-3 rounded-xl bg-[#fafcff] px-4 py-3 ring-1 ring-[#eef2fc]">
          <div className="relative w-full min-w-0 flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by year, title, ID, PDF name…"
              className="h-10 w-full rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7]/45"
            />
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <FilterSelect
              label="Year filter"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              options={TOPPER_YEAR_OPTIONS}
            />
            <FilterSelect
              label="Status filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={TOPPERS_LIST_STATUS_OPTIONS}
            />
          </div>
        </div>

        <PaginatedFigmaTable
          columns={columns}
          data={filteredRows}
          itemLabel="toppers lists"
          emptyMessage={isLoading ? 'Loading toppers lists…' : 'No toppers list PDFs match your filters.'}
          initialPageSize={10}
        />
      </div>

      <WebsiteFormModal open={formOpen} onClose={closeForm}>
        <WebsiteFormShell
          icon={FileText}
          iconClassName="text-[#55ace7]"
          title={editTarget ? 'Edit Toppers List' : 'Add Toppers List'}
          sectionTitle="PDF Details"
          onGoBack={closeForm}
          onReset={() => {
            setForm(editTarget ? form : emptyToppersListForm())
            setFormErrors({})
          }}
          onSave={handleSave}
          saveLabel={editTarget ? 'Save Changes' : 'Add Toppers List'}
          closeVariant="icon"
          saving={saving}
        >
          <ToppersListFormFields
            form={form}
            setForm={setForm}
            formErrors={formErrors}
            clearFieldError={clearFieldError}
            isEdit={Boolean(editTarget)}
          />
        </WebsiteFormShell>
      </WebsiteFormModal>

      <WebsiteFormModal open={Boolean(viewTarget)} onClose={() => setViewTarget(null)}>
        <WebsiteFormShell
          icon={FileText}
          iconClassName="text-[#55ace7]"
          title="View Toppers List"
          sectionTitle="PDF Details"
          onGoBack={() => setViewTarget(null)}
          hideFooter
          closeVariant="icon"
        >
          {viewTarget && (
            <div className="flex flex-col items-center gap-6 pb-4">
              <dl className="grid w-full max-w-lg gap-3 rounded-xl bg-[#fafcff] p-4 text-sm ring-1 ring-[#eef2fc] sm:grid-cols-2">
                <DetailItem label="Toppers List ID" value={viewTarget.toppersListId} />
                <DetailItem label="Year" value={viewTarget.year} />
                <DetailItem label="Display Order" value={viewTarget.displayOrder} />
                <DetailItem label="Status" value={viewTarget.status} />
                <DetailItem label="Title" value={viewTarget.title} className="sm:col-span-2" />
                <DetailItem
                  label="PDF File"
                  value={viewTarget.pdfFile?.fileName}
                  className="sm:col-span-2"
                />
              </dl>
              <button
                type="button"
                onClick={() => {
                  setViewTarget(null)
                  openEdit(viewTarget)
                }}
                className="inline-flex min-h-10 items-center rounded-lg bg-gradient-to-b from-[#55ace7] to-[#3d8fd4] px-6 text-sm font-semibold text-white shadow-sm"
              >
                Edit Toppers List
              </button>
            </div>
          )}
        </WebsiteFormShell>
      </WebsiteFormModal>

      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete toppers list?"
        message={
          deleteTarget
            ? `Remove ${deleteTarget.title}? This will hide the PDF from the student panel.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[118px]">
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className={cn(
          'h-10 w-full cursor-pointer appearance-none rounded-lg border-0 bg-gradient-to-b from-[#55ace7] to-[#3d8fd4] pl-4 pr-9 text-sm font-semibold text-white shadow-sm outline-none transition hover:from-[#4a9fd8] hover:to-[#3589c8] focus:ring-2 focus:ring-[#246392]/40',
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-[#222]">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
    </div>
  )
}

function DetailItem({ label, value, className }) {
  return (
    <div className={className}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#9ca0a8]">{label}</dt>
      <dd className="mt-0.5 font-medium text-[#14213D]">{value || '—'}</dd>
    </div>
  )
}
