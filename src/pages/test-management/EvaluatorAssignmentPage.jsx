import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import SourceSelectionCard from '../../components/test-management/assignment-workspace/SourceSelectionCard'
import CurrentAssignmentCard from '../../components/test-management/assignment-workspace/CurrentAssignmentCard'
import FacultyAssignmentPanel from '../../components/test-management/assignment-workspace/FacultyAssignmentPanel'
import StudentPaperSelectionTable from '../../components/test-management/assignment-workspace/StudentPaperSelectionTable'
import {
  bulkAssignEvaluator,
  fetchAssignmentBatches,
  fetchAssignmentEvaluators,
  fetchAssignmentPendingPapers,
  fetchAssignmentSubjects,
  fetchAssignmentTests,
  fetchAssignmentTopics,
  fetchCurrentPrimaryAssignment,
  clearAssignPreviewCache,
} from '../../api/evaluationOversightAPI'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import { getApiErrorMessage } from '../../utils/apiError'
import { toast } from '../../utils/toast'

export default function EvaluatorAssignmentPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const incoming = location.state?.assignmentContext || {}
  const incomingPaperIds = incoming.paperIds || []

  const [batchId, setBatchId] = useState(incoming.batchId || '')
  const [subjectId, setSubjectId] = useState(incoming.subjectId || '')
  const [topicId, setTopicId] = useState(incoming.topicId || incoming.subTopicId || '')
  const [testId, setTestId] = useState(incoming.testId || '')
  const [batches, setBatches] = useState([])
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState([])
  const [tests, setTests] = useState([])
  const [papers, setPapers] = useState([])
  const [allFaculty, setAllFaculty] = useState([])
  const [primary, setPrimary] = useState(null)
  const [selectedFacultyId, setSelectedFacultyId] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => [...incomingPaperIds])
  const [facultySearch, setFacultySearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cascadeReady, setCascadeReady] = useState(false)

  const testName = useMemo(
    () => tests.find((t) => t.value === testId)?.label || '',
    [tests, testId],
  )

  const faculty = useMemo(() => {
    const q = facultySearch.trim().toLowerCase()
    if (!q) return allFaculty
    return allFaculty.filter(
      (f) => f.name.toLowerCase().includes(q) || String(f.id).toLowerCase().includes(q),
    )
  }, [allFaculty, facultySearch])

  const loadSubjects = useCallback(async (bId) => {
    const list = await fetchAssignmentSubjects(bId)
    setSubjects(list)
    return list
  }, [])

  const loadTopics = useCallback(async (sId) => {
    const list = await fetchAssignmentTopics(sId)
    setTopics(list)
    return list
  }, [])

  const loadTests = useCallback(async (bId, sId, tId) => {
    const list = await fetchAssignmentTests(bId, sId, tId)
    setTests(list)
    return list
  }, [])

  const loadWorkspace = useCallback(async () => {
    if (!batchId || !subjectId || !testId) {
      setPapers([])
      setAllFaculty([])
      setPrimary(null)
      setWorkspaceLoading(false)
      return
    }

    setWorkspaceLoading(true)
    try {
      clearAssignPreviewCache()
      const current = await fetchCurrentPrimaryAssignment({
        batchId,
        subjectId,
        topicId,
        testId,
      })
      const [paperRows, evaluators] = await Promise.all([
        fetchAssignmentPendingPapers({
          batchId,
          subjectId,
          topicId,
          testId,
          status: statusFilter,
        }),
        fetchAssignmentEvaluators(subjectId, {
          excludeMentorId: current?.mentorId,
          context: { batchId, subjectId, topicId, testId, status: statusFilter },
        }),
      ])
      setPapers(paperRows)
      setAllFaculty(evaluators)
      setPrimary(current)
      setSelectedFacultyId((prev) => {
        if (prev && evaluators.some((e) => e.id === prev)) return prev
        const pick = evaluators.find((e) => e.workloadLevel === 'low') || evaluators[0]
        return pick?.id || ''
      })
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load assignment data'))
      setPapers([])
      setAllFaculty([])
      setPrimary(null)
    } finally {
      setWorkspaceLoading(false)
    }
  }, [batchId, subjectId, topicId, testId, statusFilter])

  useEffect(() => {
    let cancelled = false
    setCascadeReady(false)
    fetchAssignmentBatches()
      .then((list) => {
        if (cancelled) return
        setBatches(list)
        setBatchId((prev) => {
          const preferred = prev || incoming.batchId
          if (preferred && list.some((b) => b.value === preferred)) return preferred
          return list[0]?.value || ''
        })
        if (!list.length) setCascadeReady(true)
      })
      .catch(() => {
        if (!cancelled) setCascadeReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [incoming.batchId])

  useEffect(() => {
    if (!batchId) return
    let cancelled = false
    loadSubjects(batchId)
      .then((list) => {
        if (cancelled) return
        setSubjectId((prev) => {
          const preferred = prev || incoming.subjectId
          if (preferred && list.some((s) => s.value === preferred)) return preferred
          return list[0]?.value || ''
        })
        if (!list.length) setCascadeReady(true)
      })
      .catch(() => {
        if (!cancelled) setCascadeReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [batchId, incoming.subjectId, loadSubjects])

  useEffect(() => {
    if (!subjectId) return
    let cancelled = false
    loadTopics(subjectId)
      .then((list) => {
        if (cancelled) return
        setTopics(list)
        setTopicId((prev) => {
          const preferred = prev || incoming.topicId || incoming.subTopicId
          if (preferred && list.some((t) => t.value === preferred)) return preferred
          if (list.length) return list[0].value
          return prev || ''
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [subjectId, incoming.topicId, incoming.subTopicId, loadTopics])

  useEffect(() => {
    if (!batchId || !subjectId) return
    let cancelled = false
    loadTests(batchId, subjectId, topicId)
      .then((list) => {
        if (cancelled) return
        setTests(list)
        setTestId((prev) => {
          const preferred = prev || incoming.testId
          if (preferred && list.some((t) => t.value === preferred)) return preferred
          return list[0]?.value || ''
        })
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCascadeReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [batchId, subjectId, topicId, incoming.testId, loadTests])

  useEffect(() => {
    if (!papers.length || !incomingPaperIds.length) return
    setSelectedIds((prev) => {
      if (prev.length) return prev
      return incomingPaperIds.filter((id) => papers.some((p) => p.id === id))
    })
  }, [papers, incomingPaperIds])

  useEffect(() => {
    if (!cascadeReady) return
    loadWorkspace()
  }, [cascadeReady, loadWorkspace])

  const handleBatchChange = (id) => {
    setBatchId(id)
    setSubjectId('')
    setTopicId('')
    setTestId('')
    setSelectedIds([])
    setSelectedFacultyId('')
  }

  const handleSubjectChange = (id) => {
    setSubjectId(id)
    setTopicId('')
    setTestId('')
    setSelectedIds([])
    setSelectedFacultyId('')
  }

  const handleTopicChange = (id) => {
    setTopicId(id)
    setTestId('')
    setSelectedIds([])
    setSelectedFacultyId('')
  }

  const handleTestChange = (id) => {
    setTestId(id)
    setSelectedIds([])
  }

  const toggleRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const toggleAll = (select) => {
    setSelectedIds(select ? papers.map((p) => p.id) : [])
  }

  const handleConfirm = async () => {
    if (!selectedFacultyId) {
      toast.error('Select an evaluator')
      return
    }
    if (!selectedIds.length) {
      toast.error('Select at least one student paper')
      return
    }

    const mentor = faculty.find((f) => f.id === selectedFacultyId)
    if (mentor?.workloadLevel === 'high') {
      toast.message('Note: This mentor has a high workload')
    }

    setSaving(true)
    try {
      const result = await bulkAssignEvaluator({
        paperIds: selectedIds,
        mentorId: selectedFacultyId,
        subjectId,
      })
      toast.success(`Reassigned ${result.count} paper${result.count === 1 ? '' : 's'}`)
      navigate(TEST_MANAGEMENT_ROUTES.evaluations)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Reassignment failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <TestManagementPageShell
      icon={UserPlus}
      title="Assign Evaluators"
      actions={
        <button
          type="button"
          onClick={() => navigate(TEST_MANAGEMENT_ROUTES.evaluations)}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/30 bg-white/90 px-4 text-sm font-semibold text-[#1a3a5c] shadow-sm hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Oversight
        </button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
        <div className="space-y-4 lg:col-span-4 xl:col-span-3">
          <SourceSelectionCard
            batches={batches}
            subjects={subjects}
            topics={topics}
            tests={tests}
            batchId={batchId}
            subjectId={subjectId}
            topicId={topicId}
            testId={testId}
            onBatchChange={handleBatchChange}
            onSubjectChange={handleSubjectChange}
            onTopicChange={handleTopicChange}
            onTestChange={handleTestChange}
            loading={workspaceLoading}
          />
          <CurrentAssignmentCard assignment={primary} loading={workspaceLoading} />
          <FacultyAssignmentPanel
            search={facultySearch}
            onSearchChange={setFacultySearch}
            faculty={faculty}
            selectedFacultyId={selectedFacultyId}
            onSelectFaculty={setSelectedFacultyId}
            loading={workspaceLoading}
          />
        </div>

        <div className="flex w-full min-w-0 flex-col lg:col-span-8 xl:col-span-9">
          <StudentPaperSelectionTable
            papers={papers}
            testName={testName}
            selectedIds={selectedIds}
            onToggle={toggleRow}
            onToggleAll={toggleAll}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onBulkSelectAll={() => setSelectedIds(papers.map((p) => p.id))}
            loading={workspaceLoading}
            selectedCount={selectedIds.length}
            totalCount={papers.length}
            onSelectAll={() => setSelectedIds(papers.map((p) => p.id))}
            onCancel={() => navigate(TEST_MANAGEMENT_ROUTES.evaluations)}
            onConfirm={handleConfirm}
            saving={saving}
          />
        </div>
      </div>
    </TestManagementPageShell>
  )
}
