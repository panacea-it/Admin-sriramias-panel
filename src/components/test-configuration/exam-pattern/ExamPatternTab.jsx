import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../figma/PageBanner'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import { BannerButton, StatusBadge } from '../../academics/AcademicsUi'
import {
  ExamPatternTableActions,
  createTestConfigActionsColumn,
  testConfigStatusColumn,
  testConfigTableProps,
} from '../TestConfigTableActions'
import { useExamPatternManagement } from '../../../hooks/useExamPatternManagement'
import { getApiErrorMessage } from '../../../utils/apiError'
import {
  buildCreateExamPatternPayload,
  buildUpdateExamPatternPayload,
  EXAM_PATTERN_SORT_OPTIONS,
  formatExamPatternDateTime,
  mapApiExamPatternToLocal,
} from '../../../utils/examPatternApiHelpers'
import {
  createExamPattern,
  deleteExamPattern,
  getExamPatternById,
  updateExamPattern,
  updateExamPatternStatus,
} from '../../../services/examPatternService'
import ConfigFilterToolbar, { FilterSelect } from '../ConfigFilterToolbar'
import ExamPatternFormModal from './ExamPatternFormModal'
import ExamPatternViewModal from './ExamPatternViewModal'
import ConfirmExamPatternStatusModal from './ConfirmExamPatternStatusModal'

export default function ExamPatternTab() {
  const {
    rows,
    tableLoading,
    search,
    setSearch,
    status,
    setStatus,
    sortPreset,
    setSortPreset,
    controlledPagination,
    refreshExamPatterns,
  } = useExamPatternManagement()

  const [modalOpen, setModalOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [editDetail, setEditDetail] = useState(null)
  const [editDetailLoading, setEditDetailLoading] = useState(false)
  const [viewRow, setViewRow] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)

  const loadExamPatternDetail = useCallback(async (row) => {
    const data = await getExamPatternById(row.id)
    return mapApiExamPatternToLocal(data) || row
  }, [])

  const handleView = useCallback(
    async (row) => {
      setViewRow(row)
      setViewLoading(true)
      try {
        const detail = await loadExamPatternDetail(row)
        if (detail) setViewRow(detail)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load instruction details'))
        setViewRow(null)
      } finally {
        setViewLoading(false)
      }
    },
    [loadExamPatternDetail],
  )

  const handleEdit = useCallback(
    async (row) => {
      setEditRow(row)
      setEditDetail(row)
      setEditDetailLoading(true)
      setModalOpen(true)
      try {
        const detail = await loadExamPatternDetail(row)
        setEditDetail(detail || row)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load instruction for editing'))
        setModalOpen(false)
        setEditRow(null)
        setEditDetail(null)
      } finally {
        setEditDetailLoading(false)
      }
    },
    [loadExamPatternDetail],
  )

  useEffect(() => {
    if (!modalOpen) {
      setEditRow(null)
      setEditDetail(null)
      setEditDetailLoading(false)
    }
  }, [modalOpen])

  const handleSave = async (form) => {
    const isEdit = Boolean(editRow?.id)
    if (isEdit) {
      setUpdateLoading(true)
    } else {
      setCreateLoading(true)
    }

    try {
      if (isEdit) {
        await updateExamPattern(editRow.id, buildUpdateExamPatternPayload(form))
        toast.success('Instruction updated successfully')
      } else {
        await createExamPattern(buildCreateExamPatternPayload(form))
        toast.success('Instruction created successfully')
      }
      setModalOpen(false)
      setEditRow(null)
      setEditDetail(null)
      await refreshExamPatterns()
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, isEdit ? 'Failed to update instruction' : 'Failed to create instruction'),
      )
      throw error
    } finally {
      setCreateLoading(false)
      setUpdateLoading(false)
    }
  }

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteExamPattern(deleteTarget.id)
      toast.success('Instruction deleted successfully')
      setDeleteTarget(null)
      await refreshExamPatterns()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete instruction'))
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, refreshExamPatterns])

  const confirmStatusChange = useCallback(async () => {
    if (!statusTarget) return
    const activating = statusTarget.status !== 'Active'
    const nextApiStatus = activating ? 'ACTIVE' : 'INACTIVE'

    setStatusLoading(true)
    try {
      await updateExamPatternStatus(statusTarget.id, nextApiStatus)
      toast.success(
        activating ? 'Instruction enabled successfully' : 'Instruction disabled successfully',
      )
      setStatusTarget(null)
      await refreshExamPatterns()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update instruction status'))
    } finally {
      setStatusLoading(false)
    }
  }, [statusTarget, refreshExamPatterns])

  const columns = useMemo(
    () => [
      {
        key: 'instructionId',
        label: 'Instruction ID',
        headerClassName: 'pl-6 sm:pl-10',
        cellClassName: 'pl-6 sm:pl-10',
        render: (r) => r.instructionId || r.id || '—',
      },
      {
        key: 'instructionDescription',
        label: 'Instruction Description',
        render: (r) => (
          <span className="line-clamp-2 max-w-md font-medium text-[#1a3a5c]">
            {r.instructionDescription || '—'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created On',
        width: 168,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'whitespace-nowrap align-middle',
        render: (r) => formatExamPatternDateTime(r.createdAt),
      },
      {
        key: 'updatedAt',
        label: 'Modified On',
        width: 168,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'whitespace-nowrap align-middle',
        render: (r) => formatExamPatternDateTime(r.updatedAt),
      },
      {
        ...testConfigStatusColumn,
        render: (r) => <StatusBadge status={r.status} />,
      },
      createTestConfigActionsColumn((row) => (
        <ExamPatternTableActions
          row={row}
          onView={() => handleView(row)}
          onEdit={() => handleEdit(row)}
          onToggleStatus={() => setStatusTarget(row)}
          onDelete={() => setDeleteTarget(row)}
        />
      )),
    ],
    [handleView, handleEdit],
  )

  const saving = createLoading || updateLoading

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageBanner
        icon={ClipboardList}
        title="Exam Pattern"
        className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
      >
        <BannerButton
          onClick={() => {
            setEditRow(null)
            setEditDetail(null)
            setModalOpen(true)
          }}
        >
          Add Instruction
        </BannerButton>
      </PageBanner>

      <ConfigFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search instructions…"
        status={status}
        onStatusChange={setStatus}
        extraFilters={
          <FilterSelect
            value={sortPreset}
            onChange={setSortPreset}
            label="Sort By"
            includeAll={false}
            options={EXAM_PATTERN_SORT_OPTIONS.map((o) => o.value)}
            optionLabels={Object.fromEntries(EXAM_PATTERN_SORT_OPTIONS.map((o) => [o.value, o.label]))}
          />
        }
      />

      <PaginatedFigmaTable
        columns={columns}
        data={rows}
        loading={tableLoading}
        emptyMessage="No instructions found."
        itemLabel="instructions"
        controlledPagination={controlledPagination}
        resetDeps={[search, status, sortPreset]}
        {...testConfigTableProps}
      />

      <ExamPatternFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditRow(null)
          setEditDetail(null)
        }}
        item={editDetail}
        loading={editDetailLoading}
        onSubmit={handleSave}
        saving={saving}
      />

      <ExamPatternViewModal
        open={Boolean(viewRow)}
        onClose={() => setViewRow(null)}
        row={viewRow}
        loading={viewLoading}
      />

      <ConfirmExamPatternStatusModal
        open={Boolean(statusTarget)}
        activating={statusTarget?.status !== 'Active'}
        loading={statusLoading}
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />

      
    </div>
  )
}
