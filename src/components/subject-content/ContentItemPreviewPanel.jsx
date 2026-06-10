import { Download, Eye, FileText, X } from 'lucide-react'
import { contentTypeFromCategoryType } from '../../utils/facultySubjectHierarchy'
import { getTestSeriesFlat } from '../../utils/batchTestSeriesForm'
import { parseDateForDisplay } from '../../utils/academicsSubjectsStorage'
import { resolveLanguageQuestionPapersFromBlock } from '../../utils/prelimsLanguageQuestionPapers'
import {
  downloadBrochurePdf,
  formatBrochureFileSize,
  viewBrochurePdf,
} from '../../utils/batchBrochure'

export default function ContentItemPreviewPanel({ category, row, onClose }) {
  if (!row) return null
  const contentType = contentTypeFromCategoryType(category?.categoryType)
  const payload = row.payload

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold text-[#1a3a5c]">Preview</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          aria-label="Close preview"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {contentType === 'live' && payload && (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-slate-500">Class Title</dt>
            <dd className="font-medium">{payload.classTitle}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">Date</dt>
            <dd>{parseDateForDisplay(payload.date)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">Time</dt>
            <dd>{payload.startTime || payload.scheduledTime}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">Center</dt>
            <dd>{payload.center}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">Classroom</dt>
            <dd>{payload.classroom || payload.classRoom}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">Status</dt>
            <dd>{payload.status}</dd>
          </div>
          {payload.meetingUrl && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold text-slate-500">Meeting URL</dt>
              <dd className="break-all text-[#246392]">{payload.meetingUrl}</dd>
            </div>
          )}
        </dl>
      )}

      {contentType === 'recording' && payload && (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-slate-500">Lesson</dt>
            <dd className="font-medium">{payload.lessonName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">Duration</dt>
            <dd>{payload.videoDuration}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold text-slate-500">Description</dt>
            <dd>{payload.description || '—'}</dd>
          </div>
          {payload.youtubeUrl && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold text-slate-500">Video URL</dt>
              <dd className="break-all text-[#246392]">{payload.youtubeUrl}</dd>
            </div>
          )}
        </dl>
      )}

      {(contentType === 'test' || contentType === 'mainsAnswerWriting') && payload && (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {(() => {
            const flat = getTestSeriesFlat(payload)
            const languagePapers = resolveLanguageQuestionPapersFromBlock(payload)
            const languages = payload.languages?.length
              ? payload.languages
              : flat.languages || []

            return (
              <>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Title</dt>
                  <dd className="font-medium">{flat.testName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Duration</dt>
                  <dd>{flat.durationMinutes ? `${flat.durationMinutes} mins` : '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Total Marks</dt>
                  <dd>{flat.totalMarks || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Questions</dt>
                  <dd>{payload.questions?.length ?? 0}</dd>
                </div>
                {contentType === 'test' && languages.length > 0 ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-slate-500">Languages</dt>
                    <dd>{languages.join(', ')}</dd>
                  </div>
                ) : null}
                {contentType === 'test' && languagePapers.length > 0 ? (
                  <div className="sm:col-span-2">
                    <dt className="mb-2 text-xs font-semibold text-slate-500">Question Papers</dt>
                    <dd>
                      <ul className="space-y-2">
                        {languagePapers.map((paper) => {
                          const hasPdf = Boolean(paper.fileName || paper.pdfUrl)
                          return (
                            <li
                              key={paper.language}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2"
                            >
                              <span className="inline-flex min-w-0 items-center gap-2 font-medium text-[#1a3a5c]">
                                <FileText className="h-4 w-4 shrink-0 text-[#246392]" />
                                <span className="truncate">
                                  {hasPdf ? (
                                    <>
                                      <span className="text-emerald-700">✓</span> {paper.language}{' '}
                                      PDF
                                    </>
                                  ) : (
                                    `${paper.language} — not uploaded`
                                  )}
                                </span>
                                {paper.fileSize != null ? (
                                  <span className="text-xs font-normal text-slate-500">
                                    ({formatBrochureFileSize(paper.fileSize)})
                                  </span>
                                ) : null}
                              </span>
                              {hasPdf && paper.pdfUrl ? (
                                <span className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => viewBrochurePdf(paper.pdfUrl)}
                                    className="inline-flex items-center gap-1 rounded-md border border-[#55ace7]/20 bg-white px-2.5 py-1 text-xs font-semibold text-[#246392] hover:bg-[#eef6fc]"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    View PDF
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      downloadBrochurePdf(paper.pdfUrl, paper.fileName)
                                    }
                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                    Download
                                  </button>
                                </span>
                              ) : null}
                            </li>
                          )
                        })}
                      </ul>
                    </dd>
                  </div>
                ) : null}
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-slate-500">Instructions</dt>
                  <dd className="whitespace-pre-wrap">{flat.instructions || '—'}</dd>
                </div>
              </>
            )
          })()}
        </dl>
      )}

      {contentType === 'pdf' && (
        <div>
          <p className="mb-2 text-sm font-medium">{row.pdfName || row.fileName}</p>
          {payload?.pdfUrl ? (
            <iframe
              title="PDF preview"
              src={payload.pdfUrl}
              className="h-[min(60vh,480px)] w-full rounded-lg border"
            />
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
              PDF file: {row.fileName || 'No preview available for uploaded file name only.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
