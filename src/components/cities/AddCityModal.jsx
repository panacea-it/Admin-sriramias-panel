import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { MapPin } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import CenterDropdown from '../academics/CenterDropdown'
import { CourseFormField, CourseInput } from '../courses/CourseFormField'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { EMPTY_CITY_FORM, cityToForm } from '../../utils/cityFormUtils'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

const fieldClass = cn(
  'h-11 w-full rounded-xl bg-[#d1e9f6] px-4 text-sm outline-none',
  'focus:ring-2 focus:ring-[#55ace7]/40',
)

export default function AddCityModal({ open, onClose, city, onSave, saving, loading = false }) {
  const isEdit = Boolean(city?.id)
  const cityRef = useRef(city)
  cityRef.current = city
  const editKey = getModalEditKey(city)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({ defaultValues: EMPTY_CITY_FORM })

  const centerId = watch('centerId')

  useInitOnModalOpen(open, editKey, () => {
    reset(cityToForm(cityRef.current))
    clearErrors()
  })

  const onSubmit = async (values) => {
    if (!values.centerId) {
      setError('centerId', { message: 'Centre is required' })
      return
    }
    if (!String(values.placeName || '').trim()) {
      setError('placeName', { message: 'Place name is required' })
      return
    }

    try {
      await onSave({
        centerId: values.centerId,
        placeName: values.placeName,
        status: cityRef.current?.status || 'Active',
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
        className="flex max-h-[min(90vh,640px)] flex-col overflow-hidden rounded-2xl bg-[#f0f4f8]"
      >
        <ModalPanelHeader
          icon={MapPin}
          title={isEdit ? 'Edit Place' : 'Add City'}
          subtitle="Link a branch place to a centre"
          onClose={onClose}
          closeVariant="icon"
        />

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          {loading ? (
            <div className="space-y-4">
              <div className="h-11 animate-pulse rounded-xl bg-[#d1e9f6]" />
              <div className="h-11 animate-pulse rounded-xl bg-[#d1e9f6]" />
            </div>
          ) : (
            <>
              <CenterDropdown
                value={centerId}
                onChange={(id) => {
                  setValue('centerId', id, { shouldDirty: true })
                  clearErrors('centerId')
                }}
                error={errors.centerId?.message}
                disabled={isEdit}
              />

              <CourseFormField label="Place Name" required>
                <CourseInput
                  {...register('placeName', { required: 'Place name is required' })}
                  placeholder="e.g. NCR, Kukatpally, Indiranagar"
                  className={fieldClass}
                />
                {errors.placeName && (
                  <p className="text-xs text-red-500">{errors.placeName.message}</p>
                )}
              </CourseFormField>
            </>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-slate-200/80 bg-[#f0f4f8] px-5 pb-5 pt-4 sm:px-6">
          <FormModalSubmitBar
            isEditMode={isEdit}
            onReset={() => {
              reset(cityToForm(cityRef.current))
              clearErrors()
              toast.message('Form reset')
            }}
            isSubmitting={saving}
            disableSubmit={loading}
            disableReset={loading}
            createLabel="Save City"
            updateLabel="Update City"
            resetLabel="Reset"
            loadingLabel="Saving…"
          />
        </div>
      </form>
    </Modal>
  )
}
