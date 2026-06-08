import { useMemo, useState } from 'react'
import { Image } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import SectionBar from '../courses/SectionBar'
import BannerImageUpload from '../courses/BannerImageUpload'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import {
  BANNER_CATEGORIES,
  BANNER_CENTERS,
  BANNER_COURSE_OPTIONS,
  BANNER_STATUSES,
} from '../../data/bannersData'
import { bannerFormToPayload, bannerRowToForm } from '../../utils/bannerFormMappers'
import { useModalForm } from '../../hooks/useModalForm'
import { CourseFormField, CourseSelect } from '../courses/CourseFormField'

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function BannerEditModal({ open, onClose, banner, onSave, saving = false }) {
  const { form, setForm, isEditMode } = useModalForm(open, banner, bannerRowToForm, () =>
    bannerRowToForm({
      course: '',
      category: BANNER_CATEGORIES[0],
      center: BANNER_CENTERS[0],
      status: 'Active',
      imageUrl: '',
      imageFileName: '',
      hasThumbnail: false,
    }),
  )
  const [submitting, setSubmitting] = useState(false)

  const courseOptions = useMemo(() => {
    const names = new Set(BANNER_COURSE_OPTIONS)
    if (banner?.course) names.add(banner.course)
    if (form.course) names.add(form.course)
    return [...names]
  }, [banner?.course, form.course])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleImageChange = async ({ file, previewUrl, fileName }) => {
    if (!file) {
      setForm((f) => ({
        ...f,
        bannerPreview: '',
        imageUrl: '',
        imageFileName: '',
        clearImage: true,
      }))
      return
    }
    try {
      const dataUrl = previewUrl?.startsWith('blob:')
        ? await readFileAsDataUrl(file)
        : previewUrl
      setForm((f) => ({
        ...f,
        bannerPreview: dataUrl,
        imageUrl: dataUrl,
        imageFileName: fileName,
        clearImage: false,
      }))
    } catch {
      toast.error('Could not read image file')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.course?.trim()) {
      toast.error('Course is required')
      return
    }
    if (!form.category || !form.center) {
      toast.error('Category and center are required')
      return
    }

    setSubmitting(true)
    try {
      const payload = bannerFormToPayload(form)
      await onSave?.(payload, { id: banner?.id, isEdit: isEditMode })
      toast.success('Banner updated successfully')
      onClose()
    } catch (err) {
      const msg = err?.validation
        ? Object.values(err.validation)[0]
        : err?.message || 'Failed to save banner'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const busy = saving || submitting

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Edit Banner" showCloseButton={false}>
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-[#f0f4f8] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title="Edit Banner"
          subtitle={banner?.course}
          onClose={onClose}
          icon={Image}
          iconClassName="text-[#246392]"
          closeVariant="icon"
        />

        <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
          <SectionBar title="Banner Details" />

          <div className="grid gap-4 sm:grid-cols-2">
            <CourseFormField label="Course" required className="sm:col-span-2">
              <CourseSelect value={form.course} onChange={update('course')} required>
                <option value="">Select course</option>
                {courseOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </CourseSelect>
            </CourseFormField>

            <CourseFormField label="Category" required>
              <CourseSelect value={form.category} onChange={update('category')} required>
                {BANNER_CATEGORIES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </CourseSelect>
            </CourseFormField>

            <CourseFormField label="Center" required>
              <CourseSelect value={form.center} onChange={update('center')} required>
                {BANNER_CENTERS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </CourseSelect>
            </CourseFormField>

            <CourseFormField label="Status" required>
              <CourseSelect value={form.status} onChange={update('status')} required>
                {BANNER_STATUSES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </CourseSelect>
            </CourseFormField>
          </div>

          <CourseFormField label="Banner Image">
            <BannerImageUpload
              previewUrl={form.clearImage ? '' : form.bannerPreview}
              fileName={form.clearImage ? '' : form.imageFileName}
              onChange={handleImageChange}
            />
          </CourseFormField>
        </div>

        <div className="sticky bottom-0 border-t border-slate-200/80 bg-[#f0f4f8] px-5 pb-5 pt-4 sm:px-6">
          <FormModalSubmitBar
            isEditMode
            onReset={() => {
              if (banner) setForm(bannerRowToForm(banner))
              toast.message('Form reset')
            }}
            isSubmitting={busy}
            updateLabel={busy ? 'Saving…' : 'Save Changes'}
            resetLabel="Reset"
          />
        </div>
      </form>
    </Modal>
  )
}
