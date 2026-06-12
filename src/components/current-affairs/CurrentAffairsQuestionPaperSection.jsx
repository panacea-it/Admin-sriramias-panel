import { useCallback, useState } from 'react'
import { FileSpreadsheet, Upload } from 'lucide-react'
import { toast } from '@/utils/toast'
import SectionBar from '../courses/SectionBar'
import CurrentAffairsBulkUploadModal from './CurrentAffairsBulkUploadModal'

function deriveSectionRange(questions = []) {
  const numbers = questions
    .map((q) => parseInt(String(q.questionNo), 10))
    .filter((n) => Number.isFinite(n) && n > 0)

  if (!numbers.length) {
    return { sectionFrom: '', sectionTo: '' }
  }

  return {
    sectionFrom: String(Math.min(...numbers)),
    sectionTo: String(Math.max(...numbers)),
  }
}

export default function CurrentAffairsQuestionPaperSection({
  form,
  errors,
  onPatch,
  currentAffairId = null,
}) {
  const [bulkOpen, setBulkOpen] = useState(false)
  const questions = form.questions || []

  const handleImport = useCallback(
    (imported) => {
      if (!imported?.length) return
      const range = deriveSectionRange(imported)
      onPatch({
        questions: imported,
        ...range,
      })
      toast.success(`Imported ${imported.length} question(s)`)
    },
    [onPatch],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1">
          <SectionBar title="Add Question Paper" />
        </div>
        <button
          type="button"
          onClick={() => setBulkOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-[#5eb8f5] to-[#2b78a5] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(43,120,165,0.35)] transition hover:brightness-105"
        >
          <Upload className="h-4 w-4" />
          Bulk Upload Questions
        </button>
      </div>

      {errors.questions ? (
        <p className="text-xs font-medium text-red-600">{errors.questions}</p>
      ) : null}

      {questions.length > 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#cfe8f7] bg-[#f8fbff] px-4 py-4 sm:px-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#d1e9f6]">
            <FileSpreadsheet className="h-5 w-5 text-[#246392]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#111]">
              {questions.length} question{questions.length !== 1 ? 's' : ''} loaded
            </p>
            <p className="text-xs font-medium text-[#686868]">
              Use Bulk Upload Questions to add or update question content.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#cfe8f7] bg-[#f8fbff] px-4 py-6 text-center">
          <p className="text-sm font-semibold text-[#246392]">
            Use Bulk Upload Questions to add question content.
          </p>
        </div>
      )}

      <CurrentAffairsBulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onImport={handleImport}
        currentAffairId={currentAffairId}
      />
    </div>
  )
}
