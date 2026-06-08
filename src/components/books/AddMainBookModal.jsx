import { useState } from 'react'
import { BookMarked, ImageIcon, Video } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import SectionBar from '../courses/SectionBar'
import { CourseFormField, CourseInput } from '../courses/CourseFormField'
import FileInputWithIcon from './FileInputWithIcon'

const emptyForm = {
  bookName: '',
  overview: '',
  topperRecommendation: '',
  samples: ['', '', ''],
}

export default function AddMainBookModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleClose = () => {
    setForm(emptyForm)
    onClose()
  }

  const handleReset = () => setForm(emptyForm)

  const handleSampleFile = (index) => (e) => {
    const file = e.target.files?.[0]
    setForm((f) => {
      const samples = [...f.samples]
      samples[index] = file?.name || ''
      return { ...f, samples }
    })
  }

  const addMoreSamples = () => {
    setForm((f) => ({ ...f, samples: [...f.samples, ''] }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.bookName.trim() || !form.overview.trim()) {
      toast.error('Please fill required fields')
      return
    }
    onSubmit?.(form)
    toast.success('Main book saved')
    handleClose()
  }

  return (
    <Modal open={open} onClose={handleClose} size="full">
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-xl bg-[#f7f7f7] shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
      >
        <ModalPanelHeader title="Add Main Book" onBack={handleClose} icon={BookMarked} />

        <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
          <SectionBar title="Main Book For Promotion" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CourseFormField label="Book Name" required>
              <CourseInput
                value={form.bookName}
                onChange={update('bookName')}
                placeholder="Enter book name"
              />
            </CourseFormField>
            <CourseFormField label="Overview" required>
              <div className="relative">
                <CourseInput
                  value={form.overview}
                  onChange={update('overview')}
                  placeholder="Video overview link"
                  className="pr-12"
                />
                <Video className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#55ace7]" />
              </div>
            </CourseFormField>
            <CourseFormField label="Topper's Recommendation">
              <div className="relative">
                <CourseInput
                  value={form.topperRecommendation}
                  onChange={update('topperRecommendation')}
                  placeholder="Recommendation video"
                  className="pr-12"
                />
                <Video className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#55ace7]" />
              </div>
            </CourseFormField>
          </div>

          <div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            style={{ gridTemplateColumns: undefined }}
          >
            {form.samples.map((sample, index) => (
              <CourseFormField
                key={index}
                label="Book Sample Image"
                required={index === 0}
              >
                <FileInputWithIcon
                  icon={ImageIcon}
                  value={sample}
                  onChange={handleSampleFile(index)}
                  accept="image/*"
                  placeholder="Upload sample"
                />
              </CourseFormField>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={addMoreSamples}
              className="text-xs font-bold uppercase tracking-wide text-[#55ace7] underline underline-offset-4 transition hover:text-[#246392] sm:text-sm"
            >
              Add more samples
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-2 sm:gap-6">
            <button
              type="button"
              onClick={handleReset}
              className="h-11 min-w-[140px] rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-8 text-sm font-bold text-white shadow-[0_4px_12px_rgba(36,99,146,0.35)] transition hover:opacity-95"
            >
              Reset
            </button>
            <button
              type="submit"
              className="h-11 min-w-[140px] rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#0f172a] px-8 text-sm font-bold text-white shadow-[0_4px_12px_rgba(15,23,42,0.35)] transition hover:opacity-95"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
