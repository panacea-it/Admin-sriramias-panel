import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from '@/utils/toast'
import { useContentLibrary } from '../../../contexts/ContentLibraryContext'
import ContentUploadForm from '../../../components/content-library/ContentUploadForm'
import { EMPTY_CONTENT_FORM, contentItemToForm } from '../../../utils/contentLibraryMappers'

export default function UploadContentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { subjects, topics, categories, saveItem } = useContentLibrary()
  const existing = location.state?.item
  const [form, setForm] = useState(() => contentItemToForm(existing))
  const [saving, setSaving] = useState(false)

  const submit = async (meta) => {
    if (!form.title?.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      await saveItem(form, existing, meta)
      toast.success(meta.successMessage)
      if (!existing) setForm({ ...EMPTY_CONTENT_FORM })
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ContentUploadForm
      form={form}
      setForm={setForm}
      subjects={subjects}
      topics={topics}
      categories={categories}
      existing={existing}
      saving={saving}
      onSaveDraft={() =>
        submit({
          status: 'Draft',
          successMessage: 'Saved as draft',
        })
      }
      onPublish={() =>
        submit({
          status: 'Published',
          publishedAt: new Date().toISOString(),
          approvalStatus: 'approved',
          notify: true,
          successMessage: 'Content published',
        })
      }
      onSchedule={() =>
        submit({
          status: 'Scheduled',
          successMessage: 'Publish scheduled',
        })
      }
      onArchive={async () => {
        await submit({ status: 'Archived', successMessage: 'Content archived' })
        navigate(-1)
      }}
    />
  )
}
