import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const inputClass =
  'mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-[#55ace7] focus:outline-none focus:ring-2 focus:ring-[#55ace7]/20'

export default function ContentEntityModal({
  open,
  onClose,
  title,
  fields,
  initial,
  onSubmit,
}) {
  const [form, setForm] = useState(initial || {})

  useEffect(() => {
    if (open) setForm(initial || {})
  }, [open, initial])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[180] flex items-center justify-center bg-black/45 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.form
          className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1a3a5c]">{title}</h2>
            <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {fields.map((field) => (
              <label key={field.name} className="block">
                <span className="text-sm font-medium text-slate-700">{field.label}</span>
                {field.type === 'textarea' ? (
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={form[field.name] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [field.name]: e.target.value }))}
                    required={field.required}
                  />
                ) : field.type === 'select' ? (
                  <select
                    className={inputClass}
                    value={form[field.name] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [field.name]: e.target.value }))}
                    required={field.required}
                  >
                    {field.options?.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type || 'text'}
                    className={inputClass}
                    value={form[field.name] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [field.name]: e.target.value }))}
                    required={field.required}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-white">
              Save
            </button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  )
}
