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
  errors,
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
            watch={watch}
          />
        </motion.div>
      </AnimatePresence>

      {showMock ? (
        <MockTestQuestionsSection
          control={control}
          watch={watch}
          setValue={setValue}
          errors={errors}
        />
      ) : null}

    </div>
  )
}
