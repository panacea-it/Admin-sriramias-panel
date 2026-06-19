import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, X, MessageSquareQuote } from 'lucide-react';
import { fetchHelpDeskDetails } from "../../api/helpDeskAPI";

export default function HelpDeskDescriptionModal({ ticket, open, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Handle Escape key and body scroll lock
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // 2. Fetch the live details (including the reply) when the modal opens
  useEffect(() => {
    if (!open || !ticket?._id) return;

    let isMounted = true;
    const controller = new AbortController();

    const getDetails = async () => {
      setLoading(true);
      try {
        const data = await fetchHelpDeskDetails(ticket._id, controller.signal);
        if (isMounted) setDetails(data);
      } catch (error) {
        if (error?.name !== "CanceledError")
          console.error("Failed to load ticket details:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    getDetails();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [open, ticket?._id]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && ticket && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-desk-description-title"
        >
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.article
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.28, ease: [0.21, 1.02, 0.48, 1] }}
            className="relative flex max-h-[min(88vh,560px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_48px_-12px_rgba(15,23,42,0.2)] sm:max-w-xl"
          >
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-[#f8fbff] to-white px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef6fc]">
                  <FileText
                    className="h-5 w-5 text-[#55ace7]"
                    strokeWidth={2.2}
                  />
                </span>
                <h2
                  id="help-desk-description-title"
                  className="text-lg font-bold text-[#111] sm:text-xl"
                >
                  Ticket Description
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              {/* ORIGINAL DESCRIPTION BOX */}
              <div className="rounded-xl border border-slate-100 bg-[#f8fbff]/80 px-4 py-4 sm:px-5 sm:py-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#333] sm:text-base sm:leading-7">
                  {ticket.description}
                </p>
              </div>

              {/* NEW LIVE REPLY HISTORY BOX */}
              {loading ? (
                <div className="mt-6 animate-pulse rounded-xl bg-slate-100/60 h-24 w-full" />
              ) : details?.replyMessage ? (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <MessageSquareQuote className="h-5 w-5 text-[#55ace7]" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Admin Reply
                    </h3>
                  </div>
                  <div className="rounded-xl border border-[#e8f4fc] bg-[#f8fbff] px-4 py-4 sm:px-5 sm:py-5 relative">
                    <span className="mb-2 block text-[11px] font-bold text-[#246392] uppercase tracking-wider">
                      By: {details.repliedBy || "Admin"}
                    </span>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#333] sm:text-base sm:leading-7">
                      {details.replyMessage}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <footer className="flex shrink-0 justify-end border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-[#686868] shadow-sm transition hover:bg-slate-50"
              >
                Close
              </button>
            </footer>
          </motion.article>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
