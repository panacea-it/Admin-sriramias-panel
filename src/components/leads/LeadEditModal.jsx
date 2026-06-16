import { useEffect, useState } from "react";
import { ChevronDown, Pencil } from "lucide-react";
import Modal from "../ui/Modal";
import ModalPanelHeader from "../courses/ModalPanelHeader";
import { cn } from "../../utils/cn";

const fieldClass = cn(
  "h-11 w-full rounded-xl border border-slate-200/80 bg-[#eef2fc]/60 px-4 text-sm text-[#222] outline-none transition",
  "focus:border-[#55ace7] focus:bg-white focus:ring-2 focus:ring-[#55ace7]/25",
);

const selectClass = cn(fieldClass, "cursor-pointer appearance-none pr-10");

function FormField({ label, children, className }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-semibold text-[#686868]">{label}</span>
      {children}
    </label>
  );
}

function SelectField({ label, children, className }) {
  return (
    <FormField label={label} className={className}>
      <div className="relative">
        {children}
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#686868]"
          aria-hidden
        />
      </div>
    </FormField>
  );
}

function leadToForm(lead) {
  if (!lead) {
    return {
      userName: "",
      email: "",
      mobile: "",
      courseVisited: "",
      assignedCounselor: "",
      status: "",
    };
  }

  // THE FIX: Directly grab the API's courseVisited string.
  // If it equals our fallback dash "—", return an empty string so the placeholder shows.
  const courseStr = lead.courseVisited === "—" ? "" : lead.courseVisited || "";

  // Also ensuring mobile Number maps perfectly from the API
  const mobileStr =
    lead.mobileNumber === "—" || lead.mobile === "—"
      ? ""
      : lead.mobileNumber || lead.mobile || "";

  return {
    userName: lead.userName === "—" ? "" : lead.userName || "",
    email: lead.email === "—" ? "" : lead.email || "",
    mobile: mobileStr,
    courseVisited: courseStr,
    assignedCounselor: lead.assignedCounselor || "",
    status: lead.status || "",
  };
}

export default function LeadEditModal({
  open,
  onClose,
  lead,
  counselorOptions = [],
  statusOptions = [],
  onSave,
}) {
  const [form, setForm] = useState(() => leadToForm(lead));

  useEffect(() => {
    if (open) setForm(leadToForm(lead));
  }, [open, lead]);

  if (!open || !lead) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(lead.id, form);
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Edit Lead"
      showCloseButton={false}
    >
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title="Edit Lead"
          subtitle={
            lead.userName !== "—" ? lead.userName : "Update lead details"
          }
          onClose={onClose}
          icon={Pencil}
          iconClassName="text-[#246392]"
          closeVariant="icon"
          plainCloseIcon
        />

        <div className="space-y-4 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="User Name">
              <input
                type="text"
                value={form.userName}
                onChange={handleChange("userName")}
                className={fieldClass}
                placeholder="Enter user name"
              />
            </FormField>
            <FormField label="Email">
              <input
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                className={fieldClass}
                placeholder="Enter email address"
              />
            </FormField>
            <FormField label="Mobile Number">
              <input
                type="tel"
                value={form.mobile}
                onChange={handleChange("mobile")}
                className={fieldClass}
                placeholder="Enter mobile number"
              />
            </FormField>
            <FormField label="Course Visited">
              <input
                type="text"
                value={form.courseVisited}
                onChange={handleChange("courseVisited")}
                className={fieldClass}
                placeholder="Enter course visited"
              />
            </FormField>
            <SelectField label="Assigned Counselor">
              <select
                value={form.assignedCounselor}
                onChange={handleChange("assignedCounselor")}
                className={selectClass}
              >
                {counselorOptions.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </SelectField>
            <SelectField label="Status">
              <select
                value={form.status}
                onChange={handleChange("status")}
                className={selectClass}
              >
                {statusOptions.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </SelectField>
          </div>
        </div>

        <footer className="flex flex-wrap justify-end gap-3 border-t border-[#eef2fc] bg-[#fafafa] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-[#686868] shadow-sm transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-6 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Save
          </button>
        </footer>
      </form>
    </Modal>
  );
}
