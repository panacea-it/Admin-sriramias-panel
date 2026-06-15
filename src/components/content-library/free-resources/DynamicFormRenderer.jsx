import { AnimatePresence, motion } from 'framer-motion'
import { FREE_RESOURCE_CATEGORY } from '../../../utils/freeResourceFormConstants'
import ResourceCategoryRenderer from './ResourceCategoryRenderer'
import MockTestQuestionsSection from './MockTestQuestionsSection'

export default function DynamicFormRenderer({
  category,
  register,
  control,
  watch,
  setValue,
  clearErrors,
  errors,
  previousYearDropdowns = null,
  mockTestDropdowns = null,
  mockTestId = null,
  questionsLoading = false,
  onQuestionsRefresh,
  studyMaterialDropdowns = null,
  studyMaterialFileRequired = true,
  ncertBookFileRequired = true,
  previousYearFileRequired = true,
  mockTestBulkUploadOnly = false,
}) {
  const showMock = category === FREE_RESOURCE_CATEGORY.MOCK_TEST

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={category || 'empty'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <ResourceCategoryRenderer
            category={category}
            register={register}
            errors={errors}
            setValue={setValue}
            clearErrors={clearErrors}
            watch={watch}
            previousYearDropdowns={previousYearDropdowns}
            mockTestDropdowns={mockTestDropdowns}
            studyMaterialDropdowns={studyMaterialDropdowns}
            studyMaterialFileRequired={studyMaterialFileRequired}
            ncertBookFileRequired={ncertBookFileRequired}
            previousYearFileRequired={previousYearFileRequired}
          />
        </motion.div>
      </AnimatePresence>

      {showMock ? (
        <MockTestQuestionsSection
          control={control}
          watch={watch}
          setValue={setValue}
          errors={errors}
          mockTestId={mockTestId}
          questionsLoading={questionsLoading}
          onQuestionsRefresh={onQuestionsRefresh}
          bulkUploadOnly={mockTestBulkUploadOnly}
        />
      ) : null}

    </div>
  )
}
