import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { DoorOpen } from 'lucide-react'
import Modal from '../ui/Modal'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import ClassroomLocationFields from './ClassroomLocationFields'
import { CourseFormField, CourseInput, CourseSelect } from '../courses/CourseFormField'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { normalizeClassroomStatus } from '../../utils/classroomsStorage'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

const EMPTY = {
  centerId: '',
  cityPlaceId: '',
  name: '',
  code: '',
  capacity: '',
  status: 'Active',
}

function classroomToForm(classroom) {
  if (!classroom) return { ...EMPTY }
  return {
    centerId: classroom.centerId || '',
    cityPlaceId: classroom.cityPlaceId || '',
    name: classroom.name || '',
    code: classroom.code || '',
    capacity: classroom.capacity ?? '',
    status: normalizeClassroomStatus(classroom.status),
  }
}

const fieldClass = cn(
  'h-11 w-full rounded-xl bg-[#d1e9f6] px-4 text-sm outline-none',
  'focus:ring-2 focus:ring-[#55ace7]/40',
)

export default function ClassroomFormModal({
  open,
  onClose,
  classroom,
  onSave,
  saving,
  loading = false,
}) {
  const isEdit = Boolean(classroom?.id)
  const classroomRef = useRef(classroom)
  classroomRef.current = classroom
  const editKey = getModalEditKey(classroom)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({ defaultValues: EMPTY })

  const centerId = watch('centerId')
  const cityPlaceId = watch('cityPlaceId')
  const name = watch('name')

  useInitOnModalOpen(open, editKey, () => {
    reset(classroomToForm(classroomRef.current))
    clearErrors()
  })

  const onSubmit = async (values) => {
    if (!values.centerId) {
      setError('centerId', { message: 'Centre is required' })
      return
    }
    if (!values.cityPlaceId) {
      setError('cityPlaceId', { message: 'City is required' })
      return
    }
    const capacityRaw = String(values.capacity ?? '').trim()
    if (!capacityRaw) {
      setError('capacity', { message: 'Capacity is required' })
      return
    }
    if (!/^\d+$/.test(capacityRaw) || Number(capacityRaw) < 1) {
      setError('capacity', { message: 'Capacity must be a positive number' })
      return
    }

    try {
      await onSave({
        ...values,
        capacity: Number(capacityRaw),
        description: classroomRef.current?.description || '',
        color: classroomRef.current?.color,
      })
    } catch {
      // Parent shows toast; keep modal open.
    }
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} size="md">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex max-h-[min(90vh,820px)] flex-col overflow-hidden rounded-2xl bg-[#f0f4f8]"
      >
        <ModalPanelHeader
          icon={DoorOpen}
          title={isEdit ? 'Edit Classroom' : 'Add Classroom'}
          subtitle="Manage room details and capacity"
          onClose={onClose}
          closeVariant="icon"
        />

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-11 animate-pulse rounded-xl bg-gradient-to-r from-[#eef6fc] via-[#f8fafc] to-[#eef6fc]"
                />
              ))}
            </div>
          ) : (
            <>
              <ClassroomLocationFields
                centerId={centerId}
                cityPlaceId={cityPlaceId}
                classroomName={name}
                onCenterChange={(id) => {
                  setValue('centerId', id, { shouldDirty: true })
                  setValue('cityPlaceId', '', { shouldDirty: true })
                  clearErrors(['centerId', 'cityPlaceId'])
                }}
                onCityChange={(id) => {
                  setValue('cityPlaceId', id, { shouldDirty: true })
                  clearErrors('cityPlaceId')
                }}
                errors={{
                  centerId: errors.centerId?.message,
                  cityPlaceId: errors.cityPlaceId?.message,
                }}
              />

              <CourseFormField label="Classroom Name" required>
                <CourseInput
                  {...register('name', { required: 'Classroom name is required' })}
                  placeholder="e.g. Class Room 1"
                  className={fieldClass}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </CourseFormField>

              <CourseFormField label="Classroom Code / Room Number" required>
                <CourseInput
                  {...register('code', { required: 'Classroom code is required' })}
                  placeholder="e.g. CR-01"
                  className={cn(fieldClass, 'uppercase')}
                />
                {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
              </CourseFormField>

              <CourseFormField label="Capacity" required>
                <CourseInput
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  {...register('capacity', {
                    required: 'Capacity is required',
                    validate: (v) => {
                      const raw = String(v ?? '').trim()
                      if (!/^\d+$/.test(raw) || Number(raw) < 1) {
                        return 'Capacity must be a positive number'
                      }
                      return true
                    },
                  })}
                  placeholder="e.g. 40"
                  className={fieldClass}
                  onKeyDown={(e) => {
                    if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault()
                  }}
                />
                {errors.capacity && (
                  <p className="text-xs text-red-500">{errors.capacity.message}</p>
                )}
              </CourseFormField>

              <CourseFormField label="Status">
                <CourseSelect {...register('status')}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </CourseSelect>
              </CourseFormField>
            </>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-slate-200/80 bg-[#f0f4f8] px-5 pb-5 pt-4 sm:px-6">
          <FormModalSubmitBar
            isEditMode={isEdit}
            onReset={() => {
              reset(classroomToForm(classroomRef.current))
              clearErrors()
              toast.message('Form reset')
            }}
            createLabel={saving ? 'Saving…' : 'Save'}
            updateLabel={saving ? 'Saving…' : 'Update'}
            resetLabel="Reset"
          />
        </div>
      </form>
    </Modal>
  )
}
