import { Building2, Calendar, Loader2, Mail, MapPin, Phone } from 'lucide-react';
import Modal from "../ui/Modal";
import { useCenter } from "../../hooks/center/useCenter";
import { getCreatorLabel } from "../../utils/centerHelpers";

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0 text-violet-600"
        strokeWidth={2.4}
      />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-[14px] font-semibold text-slate-900">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function StatusRow({ status }) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
      <Building2
        className="mt-0.5 h-4 w-4 shrink-0 text-violet-600"
        strokeWidth={2.4}
      />
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Status
        </p>
        <p className="mt-1 text-[14px] font-semibold">
          {status === "disabled" ? (
            <span className="text-amber-700">Disabled</span>
          ) : (
            <span className="text-emerald-700">Active</span>
          )}
        </p>
      </div>
    </div>
  );
}

function formatCreatedDate(createdAt) {
  if (!createdAt) return "—";
  return new Date(createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ViewCenterDrawer({ open, centerId, onClose }) {
  const { data: center, isLoading, isError } = useCenter(centerId, open && Boolean(centerId));

  if (!open) return null;

  const creatorLabel = getCreatorLabel(center?.createdBy);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={center?.centerName || "Center details"}
      className="w-[95%] sm:w-[85%] max-w-[740px]"
    >
      <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <header className="flex shrink-0 items-start gap-3 border-b border-slate-100 px-6 py-5 pr-14">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 text-white shadow-md">
            <Building2 className="h-5 w-5" strokeWidth={2.3} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold tracking-tight text-slate-900">
              {isLoading
                ? "Loading center…"
                : center?.centerName || "Center details"}
            </h2>
            {center && !isLoading && (
              <p className="mt-1 text-[13px] font-semibold text-violet-700">
                {center.centerCode}{" "}
                <span className="font-medium text-slate-500">
                  ·{" "}
                  {center.status === "disabled" ? (
                    <span className="text-amber-700">Disabled</span>
                  ) : (
                    <span className="text-emerald-700">Active</span>
                  )}
                </span>
              </p>
            )}
          </div>
        </header>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              <p className="text-[14px] font-semibold">
                Loading center details…
              </p>
            </div>
          ) : isError ? (
            <p className="py-8 text-center text-[14px] font-medium text-rose-600">
              Centre not found or failed to load.
            </p>
          ) : center ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Row icon={MapPin} label="Address" value={center.address || "—"} />
              </div>
              <Row icon={MapPin} label="City" value={center.city} />
              <Row icon={MapPin} label="State" value={center.state} />
              <Row icon={Phone} label="Contact" value={center.contactNumber} />
              <Row icon={Mail} label="Email" value={center.email} />
              <Row icon={Building2} label="Created by" value={creatorLabel} />
              <StatusRow status={center.status} />
              <Row
                icon={Calendar}
                label="Created"
                value={formatCreatedDate(center.createdAt)}
              />
              <Row
                icon={Calendar}
                label="Updated"
                value={formatCreatedDate(center.updatedAt)}
              />
            </div>
          ) : null}
        </div>

        <footer className="shrink-0 border-t border-slate-100 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200/80 bg-white px-5 py-3 text-[14px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Close
          </button>
        </footer>
      </div>
    </Modal>
  );
}
