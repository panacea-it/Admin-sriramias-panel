import { AnimatePresence, motion } from 'framer-motion'
import PrelimsLanguagePdfUploadCard from './PrelimsLanguagePdfUploadCard'
import {
  languagePaperErrorKey,
  syncLanguageQuestionPapers,
} from '../../../utils/prelimsLanguageQuestionPapers'

export default function PrelimsLanguageQuestionPapersSection({
  languages = [],
  papers = [],
  onPapersChange,
  errors = {},
  disabled = false,
  languageOptionOrder = [],
}) {
  const synced = syncLanguageQuestionPapers(papers, languages, languageOptionOrder)

  const updatePaper = (language, patch) => {
    const next = synced.map((paper) =>
      paper.language === language ? { ...paper, ...patch, language } : paper,
    )
    onPapersChange(next)
  }

  if (!languages.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#cfe8f7] bg-[#fafcff] px-6 py-10 text-center">
        <p className="text-sm font-semibold text-[#1a3a5c]">No languages selected</p>
        <p className="mt-1 text-xs text-[#686868]">
          Select languages above to upload question paper PDFs for each language.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {synced.map((paper) => (
          <motion.div
            key={paper.language}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <PrelimsLanguagePdfUploadCard
              language={paper.language}
              fileName={paper.fileName}
              fileSize={paper.fileSize}
              pdfUrl={paper.pdfUrl}
              onChange={(patch) => updatePaper(paper.language, patch)}
              error={errors[languagePaperErrorKey(paper.language)]}
              disabled={disabled}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
