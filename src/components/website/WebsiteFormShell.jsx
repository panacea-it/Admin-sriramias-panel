import { cn } from '../../utils/cn'

export default function WebsiteFormShell({
  icon: Icon,
  iconNode,
  iconClassName,
  title,
  sectionTitle,
  onGoBack,
  onReset,
  onSave,
  saving,
  saveLabel = 'Save',
  children,
}) {
  const sectionParts = sectionTitle.split(' ')
  const sectionFirst = sectionParts[0]
  const sectionRest = sectionParts.slice(1).join(' ')

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
      <header className="flex min-h-[56px] items-center justify-between gap-4 bg-gradient-to-r from-[#55ace7] via-[#4a9fd8] to-[#1a4d73] px-5 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
            {iconNode ||
              (Icon && (
                <Icon className={cn('h-5 w-5', iconClassName)} strokeWidth={2.4} />
              ))}
          </span>
          <h2 className="text-lg font-bold leading-none text-white sm:text-xl">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onGoBack}
          className="shrink-0 text-sm font-medium text-white underline decoration-white/90 underline-offset-[3px] transition hover:text-white/90"
        >
          Go Back
        </button>
      </header>

      <div className="mx-5 mt-5 rounded-xl border border-slate-100 bg-white px-4 py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.06)] sm:mx-6 sm:px-6">
        <h3 className="text-center text-base font-semibold">
          <span className="text-[#246392]">{sectionFirst}</span>
          {sectionRest && <span className="text-[#111]"> {sectionRest}</span>}
        </h3>
      </div>

      <div className="space-y-6 px-5 pb-2 pt-6 sm:px-8 sm:pt-8">{children}</div>

      <div className="flex flex-wrap justify-center gap-3 px-5 pb-8 pt-4 sm:gap-4 sm:px-8">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-[42px] min-w-[130px] items-center justify-center rounded-[10px] bg-gradient-to-b from-[#7ec4f0] to-[#55ace7] px-10 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 active:scale-[0.98]"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex min-h-[42px] min-w-[130px] items-center justify-center rounded-[10px] bg-gradient-to-br from-[#1e4d73] via-[#246392] to-[#0f2d45] px-10 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(36,99,146,0.35)] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? 'Saving…' : saveLabel}
        </button>
      </div>
    </article>
  )
}
