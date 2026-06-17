import { useEffect, useMemo, useRef, useState } from "react";
import { getModalEditKey, useInitOnModalOpen } from "../../hooks/modalFormSync";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Loader2, X } from "lucide-react";
import { toast } from "@/utils/toast";
import {
  buildCreateCenterPayload,
  buildUpdateCenterPayload,
  createCenter as createCenterApi,
  getCreateCenterErrorMessage,
  mapApiCenterToLocal,
} from "../../services/centerService";
import { getApiErrorMessage } from "../../utils/apiError";
import { cn } from "../../utils/cn";
import SearchableSelect from "../categories/SearchableSelect";

const INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const selectClassName = cn(
  "w-full min-h-[3rem] rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-[14px] font-medium text-slate-900 shadow-sm outline-none transition",
  "focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15",
);

const labelClass = cn(
  "mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500",
);

const inputClass = cn(
  "w-full min-h-[3rem] rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-[14px] font-medium text-slate-900 shadow-sm outline-none transition",
  "placeholder:text-slate-400",
  "focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15",
);

const sectionTitleClass = cn(
  "text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400",
);

function FormSection({ id, title, children }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h3 id={id} className={sectionTitleClass}>
        {title}
      </h3>
      <div className="rounded-xl border border-slate-100 bg-white px-4 py-5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] sm:px-5 sm:py-5">
        {children}
      </div>
    </section>
  );
}

function FormField({ id, label, error, children, className }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {error && (
        <p
          className="mt-1.5 text-[12px] font-medium text-rose-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function parseAdmins(raw) {
  return String(raw || "")
    .split(/[,;\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

const emptyForm = {
  centerName: "",
  centerCode: "",
  address: "",
  state: "",
  city: "",
  contactNumber: "",
  email: "",
  status: "active",
  assignedAdminsText: "",
};

export default function CenterFormDrawer({
  open,
  mode = "create",
  initial,
  onClose,
  onCreate,
  onUpdate,
}) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const initialRef = useRef(initial);
  initialRef.current = initial;
  const editKey = mode === "edit" ? getModalEditKey(initial) : "__create__";

  useInitOnModalOpen(open, editKey, () => {
    const row = initialRef.current;
    if (mode === "edit" && row) {
      setForm({
        centerName: row.centerName || "",
        centerCode: row.centerCode || "",
        address: row.address || "",
        state: row.state || "",
        city: row.city || "",
        contactNumber: row.contactNumber || "",
        email: row.email || "",
        status: row.status === "disabled" ? "disabled" : "active",
        assignedAdminsText: (row.assignedAdmins || []).join(", "),
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
    setLoading(false);
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const title = useMemo(
    () => (mode === "edit" ? "Edit Center" : "Create Center"),
    [mode],
  );

  const stateOptions = useMemo(() => {
    const options = INDIAN_STATES_AND_UTS.map((name) => ({
      value: name,
      label: name,
    }));
    const current = form.state.trim();
    if (current && !INDIAN_STATES_AND_UTS.includes(current)) {
      return [{ value: current, label: current }, ...options];
    }
    return options;
  }, [form.state]);

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((err) => ({ ...err, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    const centerName = form.centerName.trim();
    if (!centerName) {
      next.centerName = "Center name is required";
    } else if (!/^[A-Za-z][A-Za-z\s]*$/.test(centerName)) {
      next.centerName = "Center name can only contain letters and spaces";
    }

    if (!form.centerCode.trim()) next.centerCode = "Center code is required";

    const address = form.address.trim();
    if (!address) {
      next.address = "Address is required";
    } else if (address.length < 5) {
      next.address = "Address must be at least 5 characters";
    } else if (address.length > 200) {
      next.address = "Address must not exceed 200 characters";
    }

    if (!form.city.trim()) next.city = "City is required";
    if (!form.state.trim()) next.state = "State is required";

    const email = form.email.trim();
    if (!email) {
      next.email = "Email is required";
    } else if (!emailRe.test(email)) {
      next.email = "Enter a valid email";
    }

    const digits = String(form.contactNumber || "").replace(/\D/g, "");
    if (!digits) {
      next.contactNumber = "Contact number is required";
    } else if (digits.length !== 10) {
      next.contactNumber = "Contact number must be exactly 10 digits";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    if (mode === "edit" && initial?.centerId) {
      const payload = buildUpdateCenterPayload(form);

      try {
        setLoading(true);
        await onUpdate?.(initial.centerId, payload);
        onClose();
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(error);
        }
        toast.error(getApiErrorMessage(error, "Failed to update center"));
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      const apiPayload = buildCreateCenterPayload(form);
      const response = await createCenterApi(apiPayload);
      const mapped = mapApiCenterToLocal(response?.data ?? response) || {
        centerName: apiPayload.centerName,
        centerCode: apiPayload.centerCode,
        address: apiPayload.address,
        state: apiPayload.state,
        city: apiPayload.city,
        contactNumber: apiPayload.contactNumber,
        email: apiPayload.email,
        status: form.status,
        assignedAdmins: parseAdmins(form.assignedAdminsText),
      };
      onCreate?.(mapped);
      toast.success("Center created successfully");
      onClose();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      toast.error(getCreateCenterErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4 md:p-6">
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="center-form-title"
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className={cn(
              "relative z-[101] flex w-full flex-col overflow-hidden border border-slate-200/80 bg-white shadow-2xl",
              "h-[100dvh] max-h-[100dvh] rounded-none",
              "sm:h-auto sm:max-h-[min(90vh,860px)] sm:w-[92vw] sm:max-w-[860px] sm:rounded-2xl",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5 sm:px-8 sm:py-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 text-white shadow-md">
                  <Building2 className="h-5 w-5" strokeWidth={2.3} />
                </div>
                <div className="min-w-0">
                  <h2
                    id="center-form-title"
                    className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
                  >
                    {title}
                  </h2>
                  <p className="mt-1 max-w-xl text-[13px] leading-snug text-slate-500 sm:text-[14px]">
                    {mode === "edit"
                      ? "Configure center profile, regional details, and assigned administrators."
                      : "Configure center profile and regional details."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/60 px-6 py-6 sm:px-8 sm:py-7">
                <div className="space-y-6">
                  <FormSection
                    id="center-section-info"
                    title="Center Information"
                  >
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4">
                      <FormField
                        id="cf-name"
                        label="Center Name"
                        error={errors.centerName}
                      >
                        <input
                          id="cf-name"
                          className={cn(
                            inputClass,
                            errors.centerName &&
                              "border-rose-400 focus:border-rose-400 focus:ring-rose-500/15",
                          )}
                          value={form.centerName}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(
                              /[^A-Za-z\s]/g,
                              "",
                            );
                            setForm((f) => ({ ...f, centerName: cleaned }));
                            setErrors((err) => ({
                              ...err,
                              centerName: undefined,
                            }));
                          }}
                          placeholder="e.g. Hyderabad Center"
                          autoComplete="organization"
                        />
                      </FormField>

                      <FormField
                        id="cf-code"
                        label="Center Code"
                        error={errors.centerCode}
                      >
                        <input
                          id="cf-code"
                          className={cn(
                            inputClass,
                            errors.centerCode &&
                              "border-rose-400 focus:border-rose-400 focus:ring-rose-500/15",
                          )}
                          value={form.centerCode}
                          onChange={set("centerCode")}
                          placeholder="e.g. HYD"
                          autoCapitalize="characters"
                        />
                      </FormField>

                      <FormField
                        id="cf-status"
                        label="Status"
                        className="sm:col-span-2"
                      >
                        <select
                          id="cf-status"
                          value={form.status}
                          onChange={set("status")}
                          className={selectClassName}
                        >
                          <option value="active">Active</option>
                          <option value="disabled">Disabled</option>
                        </select>
                        <p className="mt-2 text-[12px] font-medium text-slate-500">
                          Disabled centers are excluded from operational
                          dropdown menus until they are re-enabled.
                        </p>
                      </FormField>
                    </div>
                  </FormSection>

                  <FormSection
                    id="center-section-location"
                    title="Location Details"
                  >
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4">
                      <FormField
                        id="cf-address"
                        label="Address"
                        error={errors.address}
                        className="sm:col-span-2"
                      >
                        <textarea
                          id="cf-address"
                          rows={2}
                          minLength={5}
                          maxLength={200}
                          className={cn(
                            inputClass,
                            "min-h-[5rem] resize-y py-3",
                            errors.address &&
                              "border-rose-400 focus:border-rose-400 focus:ring-rose-500/15",
                          )}
                          value={form.address}
                          onChange={set("address")}
                          placeholder="Street, area, landmark"
                        />
                      </FormField>

                      <FormField id="cf-city" label="City" error={errors.city}>
                        <input
                          id="cf-city"
                          className={cn(
                            inputClass,
                            errors.city &&
                              "border-rose-400 focus:border-rose-400 focus:ring-rose-500/15",
                          )}
                          value={form.city}
                          onChange={set("city")}
                          placeholder="City"
                          autoComplete="address-level2"
                        />
                      </FormField>

                      <FormField
                        id="cf-state"
                        label="State"
                        error={errors.state}
                      >
                        <SearchableSelect
                          options={stateOptions}
                          value={form.state}
                          onChange={(val) => {
                            setForm((f) => ({ ...f, state: val }));
                            setErrors((err) => ({ ...err, state: undefined }));
                          }}
                          placeholder="Select state"
                          emptyMessage="No matching state"
                          triggerClassName={cn(
                            selectClassName,
                            "flex items-center justify-between text-left",
                            errors.state &&
                              "border-rose-400 focus:border-rose-400 focus:ring-rose-500/15",
                          )}
                        />
                      </FormField>
                    </div>
                  </FormSection>

                  <FormSection
                    id="center-section-contact"
                    title="Contact Information"
                  >
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4">
                      <FormField
                        id="cf-phone"
                        label="Contact Number"
                        error={errors.contactNumber}
                      >
                        <input
                          id="cf-phone"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          className={cn(
                            inputClass,
                            errors.contactNumber &&
                              "border-rose-400 focus:border-rose-400 focus:ring-rose-500/15",
                          )}
                          value={form.contactNumber}
                          onChange={(e) => {
                            const digits = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10);
                            setForm((f) => ({ ...f, contactNumber: digits }));
                            setErrors((err) => ({
                              ...err,
                              contactNumber: undefined,
                            }));
                          }}
                          placeholder="10-digit mobile number"
                          autoComplete="tel"
                        />
                      </FormField>

                      <FormField
                        id="cf-email"
                        label="Email"
                        error={errors.email}
                      >
                        <input
                          id="cf-email"
                          type="email"
                          className={cn(
                            inputClass,
                            errors.email &&
                              "border-rose-400 focus:border-rose-400 focus:ring-rose-500/15",
                          )}
                          value={form.email}
                          onChange={set("email")}
                          placeholder="center@sriram.com"
                          autoComplete="email"
                        />
                      </FormField>
                    </div>
                  </FormSection>
                </div>
              </div>

              <div className="sticky bottom-0 z-10 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200/90 bg-white px-6 py-5 sm:flex-row sm:justify-end sm:px-8 sm:py-5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200/80 bg-white px-5 py-3 text-[14px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 disabled:opacity-60 sm:w-auto sm:min-w-[7.5rem]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "w-full rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-6 py-3 text-[14px] font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:translate-y-0 disabled:opacity-70 sm:w-auto sm:min-w-[10rem]",
                  )}
                >
                  {loading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      {mode === "edit" ? "Saving…" : "Creating…"}
                    </span>
                  ) : mode === "edit" ? (
                    "Save changes"
                  ) : (
                    "Create center"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
