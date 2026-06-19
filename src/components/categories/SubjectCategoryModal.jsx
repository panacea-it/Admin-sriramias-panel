import { BookOpen } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import SectionBar from '../courses/SectionBar'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import { useModalForm } from '../../hooks/useModalForm'
import { toast } from '../../utils/toast'
import {
  CategoryFormField,
  CategorySelect,
  categoryInputClass,
} from './CategoryFormField'
import {
  SUBJECT_FORM_CATEGORY_OPTIONS,
  SUBJECT_FORM_CLASSROOM_OPTIONS,
  SUBJECT_FORM_CENTER_OPTIONS,
  SUBJECT_FORM_TEACHER_OPTIONS,
  SUBJECT_FORM_TOPIC_OPTIONS,
} from '../../data/subjectFormOptions'
import CategoryDateField from './CategoryDateField'
import CategoryTimeHmsInput from './CategoryTimeHmsInput'
import { useState } from 'react'

function createEmptyForm() {
  return {
    name: '',
    mainCategoryId: '',
    topicId: '',
    topicName: '',
    teacherId: '',
    teacherName: '',
    categoryType: 'Live Class',
    classTitle: '',
    center: '',
    classRoom: '',
    scheduleDate: '',
    timeHrs: '00',
    timeMin: '00',
    timeSec: '00',
    durationHrs: '00',
    durationMin: '00',
    durationSec: '00',
    description: '',
    status: 'Active',
    iconUrl: '',
    iconFileName: '',
    iconLabel: '',
  }
}

function rowToForm(row) {
  const fd = row?.formData || {}
  return {
    name: row?.name || '',
    mainCategoryId: row?.mainCategoryId || '',
    topicId: fd.topicId || '',
    topicName: fd.topicName || '',
    teacherId: fd.teacherId || '',
    teacherName: fd.teacherName || '',
    categoryType: fd.categoryType || 'Live Class',
    classTitle: fd.classTitle || '',
    center: fd.center || '',
    classRoom: fd.classRoom || '',
    scheduleDate: fd.scheduleDate || '',
    timeHrs: fd.timeHrs ?? '00',
    timeMin: fd.timeMin ?? '00',
    timeSec: fd.timeSec ?? '00',
    durationHrs: fd.durationHrs ?? '00',
    durationMin: fd.durationMin ?? '00',
    durationSec: fd.durationSec ?? '00',
    description: row?.description || '',
    status: row?.status || 'Active',
    iconUrl: row?.iconUrl || '',
    iconFileName: row?.iconFileName || '',
    iconLabel: row?.iconLabel || row?.name?.slice(0, 2)?.toUpperCase() || '',
  }
}

export default function SubjectCategoryModal({
  open,
  onClose,
  item,
  mainCategories = [],
  onSubmit,
}) {
  const { form, setForm, isEditMode, reset } = useModalForm(
    open,
    item,
    rowToForm,
    createEmptyForm,
  )
  const [errors, setErrors] = useState({})

  const activeMainCategories = mainCategories.filter((c) => c.status === 'Active')
  const showLiveClassSection = form.categoryType === 'Live Class'

  const topicsForSubject = SUBJECT_FORM_TOPIC_OPTIONS.filter(
    (t) => !form.name || t.subject === form.name || !t.subject,
  )

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Subject name is required'
    if (!form.mainCategoryId) next.mainCategoryId = 'Subject is required'
    if (!form.teacherId) next.teacherId = 'Faculty is required'
    if (showLiveClassSection) {
      if (!form.classTitle.trim()) next.classTitle = 'Class title is required'
      if (!form.center) next.center = 'Center is required'
      if (!form.classRoom) next.classRoom = 'Class room is required'
      if (!form.scheduleDate) next.scheduleDate = 'Date is required'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleClose = () => {
    setErrors({})
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please fix the highlighted fields')
      return
    }
    const main = mainCategories.find((c) => c.id === form.mainCategoryId)
    const topic = SUBJECT_FORM_TOPIC_OPTIONS.find((t) => t.id === form.topicId)
    const teacher = SUBJECT_FORM_TEACHER_OPTIONS.find((t) => t.id === form.teacherId)

    onSubmit?.(
      {
        ...form,
        topicName: topic?.name || form.topicName,
        teacherName: teacher?.name || form.teacherName,
        formData: {
          topicId: form.topicId,
          topicName: topic?.name || '',
          teacherId: form.teacherId,
          teacherName: teacher?.name || '',
          categoryType: form.categoryType,
          classTitle: form.classTitle,
          center: form.center,
          classRoom: form.classRoom,
          scheduleDate: form.scheduleDate,
          timeHrs: form.timeHrs,
          timeMin: form.timeMin,
          timeSec: form.timeSec,
          durationHrs: form.durationHrs,
          durationMin: form.durationMin,
          durationSec: form.durationSec,
          scheduledTime: `${form.timeHrs}:${form.timeMin}:${form.timeSec}`,
          duration: `${form.durationHrs}:${form.durationMin}:${form.durationSec}`,
        },
      },
      {
        isEdit: isEditMode,
        id: item?.id,
        mainCategoryName: main?.name || '',
      },
    )
    toast.success(
      isEditMode ? 'Subject updated successfully' : 'Subject created successfully',
    )
    handleClose()
  }

  const clearError = (key) => {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="full"
      title={isEditMode ? 'Edit subject' : 'Subject creation'}
      showCloseButton={false}
    >
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
      >
        <ModalPanelHeader
          title={isEditMode ? 'Edit subject' : 'Subject creation'}
          onClose={handleClose}
          closeVariant="icon"
          plainCloseIcon
          icon={BookOpen}
          iconClassName="text-[#246392]"
        />

        <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
          <SectionBar title="Course Details" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CategoryFormField label="Subject Name" required error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    iconLabel:
                      f.iconLabel || e.target.value.slice(0, 2).toUpperCase(),
                  }))
                  clearError('name')
                }}
                className={categoryInputClass}
              />
            </CategoryFormField>

            <CategoryFormField label="Subject" required error={errors.mainCategoryId}>
              <CategorySelect
                value={form.mainCategoryId}
                onChange={(e) => {
                  setForm((f) => ({ ...f, mainCategoryId: e.target.value }))
                  clearError('mainCategoryId')
                }}
              >
                <option value="">Choose Subject</option>
                {activeMainCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </CategorySelect>
            </CategoryFormField>

            <CategoryFormField label="Topic">
              <CategorySelect
                value={form.topicId}
                onChange={(e) => setForm((f) => ({ ...f, topicId: e.target.value }))}
              >
                <option value="">Choose Topic</option>
                {topicsForSubject.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </CategorySelect>
            </CategoryFormField>

            <CategoryFormField label="Faculty" required error={errors.teacherId}>
              <CategorySelect
                value={form.teacherId}
                onChange={(e) => {
                  setForm((f) => ({ ...f, teacherId: e.target.value }))
                  clearError('teacherId')
                }}
              >
                <option value="">Choose Faculty</option>
                {SUBJECT_FORM_TEACHER_OPTIONS.filter((t) => t.name).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </CategorySelect>
            </CategoryFormField>

            <CategoryFormField label="Category">
              <CategorySelect
                value={form.categoryType}
                onChange={(e) => setForm((f) => ({ ...f, categoryType: e.target.value }))}
              >
                {SUBJECT_FORM_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </CategorySelect>
            </CategoryFormField>
          </div>

          {showLiveClassSection && (
            <>
              <SectionBar title="Live Class Details 1233" />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <CategoryFormField label="Class Title" required error={errors.classTitle}>
                  <input
                    type="text"
                    value={form.classTitle}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, classTitle: e.target.value }))
                      clearError('classTitle')
                    }}
                    className={categoryInputClass}
                  />
                </CategoryFormField>

                <CategoryFormField label="Center" required error={errors.center}>
                  <CategorySelect
                    value={form.center}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, center: e.target.value }))
                      clearError('center')
                    }}
                  >
                    <option value="">Choose Center</option>
                    {SUBJECT_FORM_CENTER_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </CategorySelect>
                </CategoryFormField>

                <CategoryFormField label="Class Room" required error={errors.classRoom}>
                  <CategorySelect
                    value={form.classRoom}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, classRoom: e.target.value }))
                      clearError('classRoom')
                    }}
                  >
                    <option value="">Choose Class Room</option>
                    {SUBJECT_FORM_CLASSROOM_OPTIONS.map((room) => (
                      <option key={room} value={room}>
                        {room}
                      </option>
                    ))}
                  </CategorySelect>
                </CategoryFormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <CategoryFormField label="Date" required error={errors.scheduleDate}>
                  <CategoryDateField
                    value={form.scheduleDate}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, scheduleDate: e.target.value }))
                      clearError('scheduleDate')
                    }}
                  />
                </CategoryFormField>

                <CategoryFormField label="Time" required>
                  <CategoryTimeHmsInput
                    hrs={form.timeHrs}
                    min={form.timeMin}
                    sec={form.timeSec}
                    onChange={({ hrs, min, sec }) =>
                      setForm((f) => ({ ...f, timeHrs: hrs, timeMin: min, timeSec: sec }))
                    }
                  />
                </CategoryFormField>

                <CategoryFormField label="Duration">
                  <CategoryTimeHmsInput
                    hrs={form.durationHrs}
                    min={form.durationMin}
                    sec={form.durationSec}
                    onChange={({ hrs, min, sec }) =>
                      setForm((f) => ({
                        ...f,
                        durationHrs: hrs,
                        durationMin: min,
                        durationSec: sec,
                      }))
                    }
                  />
                </CategoryFormField>
              </div>
            </>
          )}

          <FormModalSubmitBar
            isEditMode={isEditMode}
            onReset={reset}
            resetLabel="Reset"
            createLabel="Save"
            updateLabel="Save"
            className="border-t-0 pt-2"
          />
        </div>
      </form>
    </Modal>
  )
}
