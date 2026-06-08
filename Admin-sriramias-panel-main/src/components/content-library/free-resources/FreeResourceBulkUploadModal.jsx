import { useRef, useState } from 'react'
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import { UploadFieldHint } from '../../common/UploadFieldHint'
import { BULK_QUESTION_ACCEPT } from '../../../utils/freeResourceFormConstants'
import { parseFreeResourceBulkFile } from '../../../utils/freeResourceFormUtils'
import { validateUploadFileSync } from '../../../utils/uploadValidation'

const SAMPLE_CSV = `Question No,Question,Option 1,Option 2,Option 3,Option 4,Correct Answer,Explanation,Marks
1,Sample question?,A,B,C,D,1,Optional explanation,1
`

function downloadTemplate() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'free-resource-questions-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function FreeResourceBulkUploadModal({ open, onClose, onImport }) {
  const inputRef = useRef(null)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const reset = () => {
    setFileName('')
    setResult(null)
    setLoading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const check = validateUploadFileSync(file, 'EXCEL_BULK')
    if (!check.valid && !file.name.toLowerCase().endsWith('.json')) {
      const jsonCheck = validateUploadFileSync(file, 'CSV_METADATA')
      if (!jsonCheck.valid) {
        toast.error(check.message || jsonCheck.message)
        return
      }
    }

    setFileName(file.name)
    setLoading(true)
    try {
      const parsed = await parseFreeResourceBulkFile(file)
      setResult(parsed)
    } catch (err) {
      toast.error(err.message || 'Failed to parse file')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = () => {
    if (!result?.success?.length) {
      toast.error('No valid questions to import')
      return
    }
    onImport?.(result.success)
    toast.success(`Imported ${result.success.length} question(s)`)
    handleClose()
  }

  return (
    <Modal open={open} onClose={handleClose} size="lg" title="Bulk Upload Questions" showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-[#f7f7f7] shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
        <ModalPanelHeader title="Bulk Upload Questions" onClose={handleClose} icon={FileSpreadsheet} closeVariant="icon" />

        <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 rounded-lg border border-[#55ace7]/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#f0f9ff]"
          >
            <Download className="h-4 w-4" />
            Download Sample Template
          </button>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#55ace7]/45 bg-white px-6 py-10 text-center transition hover:border-[#55ace7] hover:bg-[#fafcff]">
            <Upload className="h-8 w-8 text-[#55ace7]" />
            <span className="text-sm font-semibold text-[#246392]">
              {fileName || 'Upload Excel, CSV, or JSON'}
            </span>
            <UploadFieldHint profile="EXCEL_BULK" className="text-xs text-gray-500" />
            <input
              ref={inputRef}
              type="file"
              accept={BULK_QUESTION_ACCEPT}
              className="sr-only"
              onChange={handleFile}
            />
          </label>

          {loading ? (
            <p className="flex items-center justify-center gap-2 text-sm text-[#246392]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Parsing file…
            </p>
          ) : null}

          {result ? (
            <div className="space-y-3 rounded-xl border border-[#eef2fc] bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-[#111]">
                Success: {result.success?.length || 0} · Failed: {result.failed?.length || 0}
              </p>
              {result.failed?.length > 0 ? (
                <div className="max-h-40 overflow-auto rounded-lg border border-red-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-red-50 font-semibold text-red-800">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.failed.map((row) => (
                        <tr key={row.row} className="border-t border-red-50">
                          <td className="px-3 py-2">{row.row}</td>
                          <td className="px-3 py-2 text-red-700">{row.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200/80 pt-5">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full bg-slate-200/80 px-6 py-2.5 text-sm font-bold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!result?.success?.length || loading}
              onClick={handleImport}
              className="rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-8 py-2.5 text-sm font-bold text-white shadow disabled:opacity-50"
            >
              Import
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
