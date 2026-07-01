import { UserRound } from 'lucide-react';
import Modal from "../ui/Modal";
import ModalPanelHeader from "../courses/ModalPanelHeader";
import { cn } from "../../utils/cn";
import { formatEnquiryLeadStatusLabel } from "../../data/enquiriesData";
import { getLeadStatusChipClass } from "./EnquiryTableSelect";

function DetailField({ label, value, className }) {
  return (
    <div className={cn("space-y-1", className)}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
        {label}
      </dt>
      <dd className="text-sm font-medium text-[#111] sm:text-base">
        {value || "—"}
      </dd>
    </div>
  );
}

export default function EnquiryViewModal({ open, onClose, enquiry, loading = false }) {
  if (!enquiry) return null;

  // THE FIX: Explicitly use assignedCounselorName. assignedCounselor holds the ID!
  const assignedCounselor =
    enquiry.assignedCounselorName?.trim() || "Not Assigned";

  const leadStatus = enquiry.leadStatus || "";
  const statusLabel = leadStatus
    ? formatEnquiryLeadStatusLabel(leadStatus)
    : "—";

  // THE FIX: Expertly format the raw ISO date string into a beautiful readable date
  let formattedDate = enquiry.enquiryDate || "—";
  if (enquiry.enquiryDateRaw || enquiry.enquiryDate) {
    const d = new Date(enquiry.enquiryDateRaw || enquiry.enquiryDate);
    if (!isNaN(d)) {
      formattedDate = `${d.toLocaleDateString("en-GB")} at ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Enquiry Details"
      showCloseButton={false}
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
        <ModalPanelHeader
          title="Enquiry Details"
          onClose={onClose}
          icon={UserRound}
          iconClassName="text-[#246392]"
          closeVariant="icon"
        />

        <div className="max-h-[min(70vh,560px)] overflow-y-auto px-5 py-6 sm:px-8 sm:py-7">
          {loading ? (
            <p className="text-sm text-[#686868]">Loading enquiry details...</p>
          ) : (
          <dl className="grid gap-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6">
            <DetailField label="Student Name" value={enquiry.student} />
            <DetailField label="Enquiry Type" value={enquiry.enquiryType} />
            <DetailField label="Email" value={enquiry.email} />
            <DetailField label="Phone" value={enquiry.phone} />
            <DetailField label="Center" value={enquiry.center} />
            <DetailField label="Course" value={enquiry.courseName} />
            <DetailField label="Source Page" value={enquiry.sourcePage} />

            {/* Display the newly formatted date */}
            <DetailField label="Date" value={formattedDate} />

            {/* Display the actual Counselor Name */}
            <DetailField label="Assigned Counselor" value={assignedCounselor} />

            <div className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Lead Status
              </dt>
              <dd>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                    getLeadStatusChipClass(leadStatus),
                  )}
                >
                  {statusLabel}
                </span>
              </dd>
            </div>

            {/* Fallback to ACTIVE just in case it is missing from the payload */}
            <DetailField
              label="Record Status"
              value={enquiry.recordStatus || enquiry.status || "ACTIVE"}
              className="sm:col-span-2"
            />
          </dl>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="min-w-[100px] rounded-lg bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(5,25,45,0.35)] transition hover:brightness-110"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
