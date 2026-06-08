export default function CurrentAssignmentCard({ assignment, loading }) {
  if (loading) {
    return (
      <article className="animate-pulse rounded-2xl bg-[#1a3a5c] p-4 shadow-[var(--card-shadow)]">
        <div className="h-4 w-32 rounded bg-white/20" />
        <div className="mt-4 h-12 w-12 rounded-full bg-white/20" />
      </article>
    )
  }

  if (!assignment) {
    return (
      <article className="rounded-2xl bg-[#1a3a5c] p-4 text-white shadow-[var(--card-shadow)]">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
          Current Primary Assignment
        </p>
        <p className="mt-3 text-sm text-white/80">No primary evaluator assigned for this test yet.</p>
      </article>
    )
  }

  return (
    <article className="rounded-2xl bg-[#1a3a5c] p-4 text-white shadow-[var(--card-shadow)]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
        Current Primary Assignment
      </p>
      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#55ace7] text-sm font-bold">
          {assignment.initials}
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold">{assignment.name}</p>
          <p className="truncate text-xs text-white/75">{assignment.title}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/10 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase text-white/60">Pending Papers</p>
          <p className="text-lg font-bold">{assignment.pendingPapers}</p>
        </div>
        <div className="rounded-lg bg-white/10 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase text-white/60">Due Date</p>
          <p className="text-sm font-bold">{assignment.dueDate}</p>
        </div>
      </div>
    </article>
  )
}
