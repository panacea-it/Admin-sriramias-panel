import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ClipboardCheck } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from '../../utils/toast'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import AnswerSheetViewer from '../../components/test-management/evaluation-workspace/AnswerSheetViewer'
import EvaluationSidebar from '../../components/test-management/evaluation-workspace/EvaluationSidebar'
import { DEFAULT_WORKSPACE_RUBRIC } from '../../data/evaluationOversightSeed'
import {
  downloadEvaluationPaper,
  fetchEvaluationPaperById,
  publishEvaluationResult,
  saveEvaluationDraft,
  savePaperAnnotations,
} from '../../api/evaluationOversightAPI'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'

const AUTOSAVE_MS = 25000

function normalizeRubric(rubric) {
  const base = Array.isArray(rubric) && rubric.length ? rubric : DEFAULT_WORKSPACE_RUBRIC
  return base.map((r) => ({ ...r }))
}

function computeRubricTotal(rubric = []) {
  return rubric.reduce((sum, r) => sum + (Number(r.score) || 0), 0)
}

export default function EvaluationWorkspacePage() {
  const { paperId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const workspaceMode = location.state?.mode || 'view'

  const [loading, setLoading] = useState(true)
  const [paper, setPaper] = useState(null)
  const [rubric, setRubric] = useState(normalizeRubric())
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(12)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [activeTool, setActiveTool] = useState('highlight')
  const silentToastRef = useRef(false)

  const locked = !!paper?.locked
  const readOnly = locked || workspaceMode === 'view'

  const pageTitle = useMemo(() => {
    if (!paper) return 'Paper Evaluation'
    if (paper.status === 'Evaluated' || workspaceMode === 'view') {
      return paper.status === 'Evaluated' ? 'View Evaluation' : 'View Paper'
    }
    return 'Detailed Paper Evaluation'
  }, [paper, workspaceMode])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchEvaluationPaperById(paperId)
      setPaper(data)
      setRubric(normalizeRubric(data.rubric))
      setDirty(false)
    } catch (err) {
      toast.error(err?.message || 'Failed to load paper')
    } finally {
      setLoading(false)
    }
  }, [paperId])

  useEffect(() => {
    load()
  }, [load])

  const buildPatch = useCallback(() => {
    const total = computeRubricTotal(rubric)
    return {
      rubric,
      annotations: paper?.annotations,
      remarks: paper?.remarks,
      scoreObtained: Math.round(total * 10) / 10,
    }
  }, [rubric, paper?.annotations, paper?.remarks])

  const saveDraft = useCallback(
    async ({ silent = false } = {}) => {
      if (!paper) return
      if (locked) {
        if (!silent) toast.error('This evaluation is locked and cannot be edited.')
        return
      }
      if (readOnly) {
        if (!silent) toast.error('Switch to Start Evaluation to save changes.')
        return
      }

      setSaving(true)
      try {
        const saved = await saveEvaluationDraft(paper.id, buildPatch())
        setPaper((prev) => ({ ...prev, ...saved, status: 'In Progress' }))
        setDirty(false)
        if (silent) {
          if (!silentToastRef.current) {
            silentToastRef.current = true
            toast.message('Draft saved')
            setTimeout(() => {
              silentToastRef.current = false
            }, 4000)
          }
        } else {
          toast.success('Draft saved successfully')
        }
      } catch (err) {
        if (!silent) toast.error(err?.message || 'Failed to save draft')
      } finally {
        setSaving(false)
      }
    },
    [paper, locked, readOnly, buildPatch],
  )

  useEffect(() => {
    if (!dirty || locked || readOnly) return undefined
    const t = setInterval(() => saveDraft({ silent: true }), AUTOSAVE_MS)
    return () => clearInterval(t)
  }, [dirty, locked, readOnly, saveDraft])

  const setRubricScore = (idx, score) => {
    if (readOnly) return
    setRubric((prev) =>
      prev.map((r, i) =>
        i === idx ? { ...r, score: Math.min(Number(r.max), Math.max(0, Number(score))) } : r,
      ),
    )
    setDirty(true)
  }

  const setRubricFeedback = (idx, feedback) => {
    if (readOnly) return
    setRubric((prev) => prev.map((r, i) => (i === idx ? { ...r, feedback } : r)))
    setDirty(true)
  }

  const handleAnnotate = async (ann) => {
    if (!paper || locked || readOnly) return
    const next = [
      ...(Array.isArray(paper.annotations) ? paper.annotations : []),
      { id: `ANN-${Date.now()}`, ...ann },
    ]
    setPaper((prev) => ({ ...prev, annotations: next }))
    setDirty(true)
    try {
      await savePaperAnnotations(paper.id, next)
    } catch {
      /* non-blocking */
    }
  }

  const handlePublish = async () => {
    if (!paper) return
    if (locked) {
      toast.error('This evaluation is already published.')
      return
    }
    if (readOnly) {
      toast.error('Switch to Start Evaluation to publish results.')
      return
    }

    const total = computeRubricTotal(rubric)
    if (total <= 0) {
      toast.error('Enter scores before publishing results.')
      return
    }

    setPublishing(true)
    try {
      const saved = await publishEvaluationResult(paper.id, buildPatch())
      setPaper((prev) => ({ ...prev, ...saved }))
      setDirty(false)
      toast.success('Results published successfully')
      navigate(TEST_MANAGEMENT_ROUTES.evaluations)
    } catch (err) {
      toast.error(err?.message || 'Failed to publish results')
    } finally {
      setPublishing(false)
    }
  }

  const handleDownload = async () => {
    if (!paper) return
    setDownloading(true)
    try {
      await downloadEvaluationPaper(paper)
      toast.success('Download started')
    } catch (err) {
      toast.error(err?.message || 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <TestManagementPageShell icon={ClipboardCheck} title="Paper Evaluation">
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-2xl bg-white shadow-sm" />
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="h-[520px] rounded-2xl bg-white lg:col-span-7" />
            <div className="h-[520px] rounded-2xl bg-white lg:col-span-5" />
          </div>
        </div>
      </TestManagementPageShell>
    )
  }

  if (!paper) {
    return (
      <TestManagementPageShell icon={ClipboardCheck} title="Paper Evaluation">
        <p className="text-sm font-semibold text-slate-600">Paper not found.</p>
      </TestManagementPageShell>
    )
  }

  return (
    <TestManagementPageShell
      icon={ClipboardCheck}
      title={pageTitle}
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
        <div className="lg:col-span-7">
          <AnswerSheetViewer
            paper={paper}
            page={page}
            pageCount={pageCount}
            scale={scale}
            rotation={rotation}
            activeTool={activeTool}
            annotations={paper.annotations}
            locked={locked || readOnly}
            downloading={downloading}
            onDownload={handleDownload}
            onPageChange={setPage}
            onScaleChange={setScale}
            onRotate={() => setRotation((r) => (r + 90) % 360)}
            onToolChange={setActiveTool}
            onPageCount={(n) => setPageCount(n || paper?.answerSheet?.pages || 12)}
            onAnnotate={handleAnnotate}
          />
        </div>
        <div className="lg:col-span-5">
          <EvaluationSidebar
            paper={paper}
            rubric={rubric}
            locked={locked}
            readOnly={readOnly}
            saving={saving}
            publishing={publishing}
            onRubricScore={setRubricScore}
            onRubricFeedback={setRubricFeedback}
            onSaveDraft={() => saveDraft({ silent: false })}
            onPublish={handlePublish}
          />
        </div>
      </div>
    </TestManagementPageShell>
  )
}
