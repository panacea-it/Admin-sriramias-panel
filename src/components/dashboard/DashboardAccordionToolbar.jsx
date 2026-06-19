export default function DashboardAccordionToolbar({ onExpandAll, onCollapseAll }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={onExpandAll}
        className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-[#d0d7e2] bg-white px-4 text-xs font-semibold text-[#246392] shadow-sm transition hover:bg-[#f8fafc]"
      >
        Expand All
      </button>
      <button
        type="button"
        onClick={onCollapseAll}
        className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-[#d0d7e2] bg-white px-4 text-xs font-semibold text-[#444] shadow-sm transition hover:bg-[#f8fafc]"
      >
        Collapse All
      </button>
    </div>
  )
}
