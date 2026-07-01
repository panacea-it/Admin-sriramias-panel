import { useMemo, useState } from 'react'
import { MessageSquareQuote, PlusCircle, Search, ChevronDown } from 'lucide-react'
import PageBanner from '../figma/PageBanner'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import WebsiteFormModal from './WebsiteFormModal'
import WebsiteFormShell from './WebsiteFormShell'
import TestimonialFormFields from './TestimonialFormFields'
import WebsiteRecordRowActions from './WebsiteRecordRowActions'
import AdminConfirmModal from '../admin/AdminConfirmModal'
import { createActionsColumn } from '../../utils/tableColumnHelpers'
import { WebsiteStatusBadge } from './websiteUi'
import {
  TESTIMONIAL_STATUS,
  TESTIMONIAL_STATUS_OPTIONS,
  TESTIMONIAL_YEAR_OPTIONS,
  emptyTestimonialForm,
} from '../../constants/testimonialsConstants'
import {
  buildTestimonialFormData,
  formFromApiTestimonial,
  mapApiTestimonialsToRows,
} from '../../utils/testimonialApiHelpers'
import {
  useChangeTestimonialStatus,
  useCreateTestimonial,
  useDeleteTestimonial,
  useTestimonials,
  useUpdateTestimonial,
} from '../../hooks/useTestimonials'
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

function validateTestimonialForm(form, { isEdit = false } = {}) {
  const errors = {}
  if (!String(form.studentName || '').trim()) errors.studentName = 'Student name is required'
  if (!String(form.rank || '').trim()) errors.rank = 'Rank is required'
  if (!String(form.year || '').trim()) errors.year = 'Year is required'
  if (!String(form.displayOrder || '').trim()) errors.displayOrder = 'Display order is required'
  if (!isEdit && !(form.imageFile instanceof File)) {
    errors.testimonialImage = 'Testimonial image is required'
  }
  return errors
}

export default function TestimonialsTab() {
  const { data: apiRows = [], isLoading } = useTestimonials()
  const createMutation = useCreateTestimonial()
  const updateMutation = useUpdateTestimonial()
  const statusMutation = useChangeTestimonialStatus()
  const deleteMutation = useDeleteTestimonial()

  const rows = useMemo(() => mapApiTestimonialsToRows(apiRows), [apiRows])
  const saving = createMutation.isPending || updateMutation.isPending
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [viewTarget, setViewTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyTestimonialForm)
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
          row.testimonialId.toLowerCase().includes(q) ||
          row.studentName.toLowerCase().includes(q) ||
          row.title.toLowerCase().includes(q) ||
          String(row.rank).includes(q)
        const matchYear = yearFilter === 'all' || String(row.year) === yearFilter
        const matchStatus = statusFilter === 'all' || row.status === statusFilter
        return matchSearch && matchYear && matchStatus
      })
      .sort((a, b) => a.displayOrder - b.displayOrder)
  }, [rows, search, yearFilter, statusFilter])

  const openAdd = () => {
    setEditTarget(null)
    setForm(emptyTestimonialForm())
    setFormErrors({})
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setEditTarget(row)
    setForm(formFromApiTestimonial(row))
    setFormErrors({})
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditTarget(null)
    setFormErrors({})
  }

  const handleSave = async () => {
    const errors = validateTestimonialForm(form, { isEdit: Boolean(editTarget) })
    if (Object.keys(errors).length) {
      setFormErrors(errors)
      return
    }

    try {
      const includeImage = form.imageFile instanceof File
      const formData = buildTestimonialFormData(form, { includeImage })

      if (editTarget) {
        await updateMutation.mutateAsync({
          id: editTarget.id,
          formData,
        })
        toast.success('Testimonial updated')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Testimonial created')
      }
      closeForm()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save testimonial'))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('Testimonial deleted')
      setDeleteTarget(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete testimonial'))
    }
  }

  const handleStatusToggle = async (row) => {
    const nextStatus =
      row.status === TESTIMONIAL_STATUS.ACTIVE
        ? TESTIMONIAL_STATUS.INACTIVE
        : TESTIMONIAL_STATUS.ACTIVE

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
        key: 'studentName',
        label: 'Student',
        headerClassName: 'min-w-[160px]',
        render: (row) => (
          <div className="min-w-0">
            <p className="truncate font-semibold text-[#14213D]">{row.studentName}</p>
            <p className="truncate text-xs text-[#667085]">{row.testimonialId}</p>
          </div>
        ),
      },
      {
        key: 'rank',
        label: 'Rank',
        width: 80,
        align: 'center',
        render: (row) => (
          <span className="text-sm font-bold text-[#246392]">{row.rank}</span>
        ),
      },
      {
        key: 'year',
        label: 'Year',
        width: 72,
        align: 'center',
        render: (row) => <span className="text-sm text-[#686868]">{row.year}</span>,
      },
      {
        key: 'title',
        label: 'Card Title',
        headerClassName: 'min-w-[220px]',
        render: (row) => (
          <span className="line-clamp-2 text-xs font-semibold uppercase tracking-wide text-[#4a6272]">
            {row.title}
          </span>
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
            rowName={row.studentName}
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
        icon={MessageSquareQuote}
        title="Testimonials"
        subtitle="Manage student testimonial cards shown on Our Toppers Gallery"
      >
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-white/95"
        >
          <PlusCircle className="h-4 w-4" strokeWidth={2.2} />
          Add Testimonial
        </button>
      </PageBanner>

      <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-[#14213D]">All Testimonials</h3>
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
              placeholder="Search by name, rank, ID…"
              className="h-10 w-full rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7]/45"
            />
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <FilterSelect
              label="Year filter"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              options={TESTIMONIAL_YEAR_OPTIONS}
            />
            <FilterSelect
              label="Status filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={TESTIMONIAL_STATUS_OPTIONS}
            />
          </div>
        </div>

        <PaginatedFigmaTable
          columns={columns}
          data={filteredRows}
          itemLabel="testimonials"
          emptyMessage={isLoading ? 'Loading testimonials…' : 'No testimonials match your filters.'}
          initialPageSize={10}
        />
      </div>

      <WebsiteFormModal open={formOpen} onClose={closeForm}>
        <WebsiteFormShell
          icon={MessageSquareQuote}
          iconClassName="text-[#55ace7]"
          title={editTarget ? 'Edit Testimonial' : 'Add Testimonial'}
          sectionTitle="Testimonial Details"
          onGoBack={closeForm}
          onReset={() => {
            setForm(editTarget ? form : emptyTestimonialForm())
            setFormErrors({})
          }}
          onSave={handleSave}
          saveLabel={editTarget ? 'Save Changes' : 'Add Testimonial'}
          closeVariant="icon"
          saving={saving}
        >
          <TestimonialFormFields
            form={form}
            setForm={setForm}
            formErrors={formErrors}
            clearFieldError={clearFieldError}
          />
        </WebsiteFormShell>
      </WebsiteFormModal>

      <WebsiteFormModal open={Boolean(viewTarget)} onClose={() => setViewTarget(null)}>
        <WebsiteFormShell
          icon={MessageSquareQuote}
          iconClassName="text-[#55ace7]"
          title="View Testimonial"
          sectionTitle="Testimonial Details"
          onGoBack={() => setViewTarget(null)}
          hideFooter
          closeVariant="icon"
        >
          {viewTarget && (
            <div className="flex flex-col items-center gap-6 pb-4">
              <dl className="grid w-full max-w-lg gap-3 rounded-xl bg-[#fafcff] p-4 text-sm ring-1 ring-[#eef2fc] sm:grid-cols-2">
                <DetailItem label="Testimonial ID" value={viewTarget.testimonialId} />
                <DetailItem label="Display Order" value={viewTarget.displayOrder} />
                <DetailItem label="Student Name" value={viewTarget.studentName} />
                <DetailItem label="Rank" value={viewTarget.rank} />
                <DetailItem label="Exam" value={viewTarget.examName} />
                <DetailItem label="Year" value={viewTarget.year} />
                <DetailItem label="Status" value={viewTarget.status} className="sm:col-span-2" />
                <DetailItem label="Quote" value={viewTarget.excerpt} className="sm:col-span-2" />
              </dl>
              <button
                type="button"
                onClick={() => {
                  setViewTarget(null)
                  openEdit(viewTarget)
                }}
                className="inline-flex min-h-10 items-center rounded-lg bg-gradient-to-b from-[#55ace7] to-[#3d8fd4] px-6 text-sm font-semibold text-white shadow-sm"
              >
                Edit Testimonial
              </button>
            </div>
          )}
        </WebsiteFormShell>
      </WebsiteFormModal>

      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete testimonial?"
        message={
          deleteTarget
            ? `Remove ${deleteTarget.studentName}'s testimonial from the list?`
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
