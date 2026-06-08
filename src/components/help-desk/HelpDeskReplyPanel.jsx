import { CornerUpRight } from 'lucide-react'

export default function HelpDeskReplyPanel({
  ticket,
  replyText,
  onReplyChange,
  onGoBack,
  onSend,
  sending = false,
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_11px_28px_rgba(15,23,42,0.08)]">
      <header className="flex min-h-[60px] flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#55ace7] via-[#6baee0] to-[#3d8fd4] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
            <CornerUpRight className="h-5 w-5 text-[#55ace7]" strokeWidth={2.4} />
          </span>
          <h2 className="text-lg font-bold text-white sm:text-xl">Reply</h2>
        </div>
        <button
          type="button"
          onClick={onGoBack}
          className="text-sm font-medium text-white underline decoration-white/80 underline-offset-4 transition hover:text-white/90"
        >
          Go Back
        </button>
      </header>

      <div className="space-y-5 px-5 py-6 sm:px-8 sm:py-8">
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-[#686868]">
          <p className="font-semibold text-[#111]">{ticket.userName}</p>
          {ticket.subject && (
            <p className="mt-1 text-sm font-medium text-[#246392]">{ticket.subject}</p>
          )}
          <p className="mt-1">
            {ticket.email} · {ticket.mobile}
          </p>
          <p className="mt-2 line-clamp-4 leading-relaxed text-[#686868]">{ticket.description}</p>
        </div>

        <div>
          <label
            htmlFor="help-desk-reply"
            className="mb-2 block text-sm font-medium text-[#686868]"
          >
            Description
          </label>
          <textarea
            id="help-desk-reply"
            value={replyText}
            onChange={(e) => onReplyChange(e.target.value)}
            rows={6}
            placeholder="Write your reply to the student..."
            className="w-full resize-y rounded-xl border-0 bg-[#eef6fc] px-4 py-3.5 text-sm text-[#111] outline-none ring-1 ring-transparent placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7]/40 sm:text-base"
          />
        </div>

        <button
          type="button"
          onClick={onSend}
          disabled={sending || !replyText.trim()}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-to-br from-[#1e4d73] via-[#246392] to-[#0f2d45] px-8 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(36,99,146,0.35)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
        >
          {sending ? 'Sending…' : 'Send Reply'}
        </button>
      </div>
    </article>
  )
}
