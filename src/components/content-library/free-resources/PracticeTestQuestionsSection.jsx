import TestQuestionsSection from './TestQuestionsSection'

export default function PracticeTestQuestionsSection({ watch, ...props }) {
  return (
    <TestQuestionsSection
      {...props}
      watch={watch}
      light
      previewTitle={watch('practiceTestTitle') || ''}
    />
  )
}
