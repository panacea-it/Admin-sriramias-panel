import { useRef, useState } from 'react'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { BellRing, Globe } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import SectionBar from '../courses/SectionBar'
import {
  CourseFormField,
  CourseInput,
  CourseMediaSlot,
  CoursePdfInput,
  CourseSelect,
  CourseTextarea,
} from '../courses/CourseFormField'
import { cn } from '../../utils/cn'
import {
  EMPTY_NOTIFICATION_FORM,
  USER_TYPE_OPTIONS,
} from '../../data/pushNotificationsData'

function UrlInput({ value, onChange, placeholder = 'https://' }) {
  return (
    <div className="relative">
      <input
        type="url"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg bg-[#e8f4fc] px-3 pr-10 text-sm text-[#333] outline-none placeholder:text-[#8b98bb] focus:ring-2 focus:ring-[#55ace7]/40 sm:text-[15px]"
      />
      <Globe className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />
    </div>
  )
}

export function buildNotificationFromForm(form, existing) {
  const now = new Date()
  const sentDate = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const sentTime = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const hasVideo = Boolean(form.videoName)
  const hasPdf = Boolean(form.pdfName)
  const type = hasVideo ? 'Video' : hasPdf ? 'PDF' : form.imageName ? 'Image' : 'Text'

  return {
    id: existing?.id ?? Date.now(),
    sentBy: existing?.sentBy ?? 'Admin',
    device: existing?.device ?? 'Android',
    message: form.message.trim(),
    center: existing?.center ?? 'New Delhi',
    type,
    sentTime: existing?.sentTime ?? sentTime,
    sentDate: existing?.sentDate ?? sentDate,
    dateBucket: 'Today',
    userType: form.userType,
    title: form.title.trim(),
    url: form.url.trim(),
    pdfName: form.pdfName,
    videoName: form.videoName,
    imageName: form.imageName,
  }
}

function formFromNotification(row) {
  return {
    userType: row.userType ?? 'All Users',
    title: row.title ?? '',
    message: row.message ?? '',
    url: row.url ?? '',
    pdfName: row.pdfName ?? '',
    videoName: row.videoName ?? '',
    imageName: row.imageName ?? '',
  }
}

export default function SendPushNotificationModal({ open, onClose, editing, onSubmit }) {
  const [form, setForm] = useState({ ...EMPTY_NOTIFICATION_FORM })
  const editingRef = useRef(editing)
  editingRef.current = editing
  const editKey = getModalEditKey(editing)

  useInitOnModalOpen(open, editKey, () => {
    const row = editingRef.current
    setForm(row ? formFromNotification(row) : { ...EMPTY_NOTIFICATION_FORM })
  })

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const setFileName = (key) => (e) => {
    const file = e.target.files?.[0]
    setForm((f) => ({ ...f, [key]: file?.name || '' }))
  }

  const handleClose = () => {
    setForm({ ...EMPTY_NOTIFICATION_FORM })
    onClose()
  }

  const handleReset = () => setForm({ ...EMPTY_NOTIFICATION_FORM })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Please fill all required fields')
      return
    }

    const notification = buildNotificationFromForm(form, editing)
    onSubmit?.(notification, editing ? 'update' : 'create')
    handleClose()
  }

  return (
    <Modal open={open} onClose={handleClose} size="full" title="Send Notification">
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-xl bg-[#f7f7f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title="Send Notification"
          onBack={handleClose}
          icon={BellRing}
          iconClassName="text-[#246392]"
        />

        <div className="max-h-[min(72vh,720px)] overflow-y-auto">
          <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
            <SectionBar title="User Type" />

            <div className="max-w-md">
              <CourseFormField label="User Type" required>
                <CourseSelect value={form.userType} onChange={update('userType')}>
                  {USER_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </CourseSelect>
              </CourseFormField>
            </div>

            <SectionBar title="Notification Details" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CourseFormField label="Title" required>
                <CourseInput
                  value={form.title}
                  onChange={update('title')}
                  placeholder="Notification title"
                />
              </CourseFormField>
              <CourseFormField label="Upload PDF (if any)">
                <CoursePdfInput fileName={form.pdfName} onChange={setFileName('pdfName')} />
              </CourseFormField>
              <CourseFormField label="Upload Video (if any)">
                <CourseMediaSlot
                  icon="video"
                  uploadProfile="VIDEO_STANDARD"
                  fileName={form.videoName}
                  placeholder="Choose video"
                  accept="video/*"
                  onFileChange={setFileName('videoName')}
                />
              </CourseFormField>
              <CourseFormField label="Upload Image (if any)">
                <CourseMediaSlot
                  uploadProfile="IMAGE_STANDARD"
                  fileName={form.imageName}
                  placeholder="Choose image"
                  accept="image/*"
                  onFileChange={setFileName('imageName')}
                />
              </CourseFormField>
              <CourseFormField label="Upload URL (if any)" className="sm:col-span-2 lg:col-span-1">
                <UrlInput value={form.url} onChange={update('url')} />
              </CourseFormField>
            </div>

            <CourseFormField label="Message" required>
              <CourseTextarea
                value={form.message}
                onChange={update('message')}
                rows={6}
                placeholder="Write your notification message..."
              />
            </CourseFormField>

            <div className="flex flex-wrap items-center justify-center gap-4 border-t border-slate-200/80 pt-8">
              <button
                type="button"
                onClick={handleReset}
                className="min-w-[140px] rounded-full bg-gradient-to-r from-[#5eb8f5] to-[#2b78a5] px-10 py-3 text-base font-bold text-white shadow-[0_6px_18px_rgba(43,120,165,0.35)] transition hover:brightness-105"
              >
                Reset
              </button>
              <button
                type="submit"
                className={cn(
                  'min-w-[140px] rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-10 py-3 text-base font-bold text-white',
                  'shadow-[0_6px_18px_rgba(5,25,45,0.4)] transition hover:brightness-110',
                )}
              >
                {editing ? 'Update' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}
