import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function FinanceSettingsFooter({
  onCancel,
  onSave,
  saving = false,
  saveLabel = 'Save settings',
  cancelLabel = 'Cancel',
  className,
}) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-5',
        className,
      )}
    >
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-[#686868] transition hover:bg-slate-50 disabled:opacity-50"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#246392] px-5 text-sm font-semibold text-white transition hover:bg-[#1a3a5c] disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saveLabel}
      </button>
    </div>
  )
}
