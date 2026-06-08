import TestQuestionsSection from './TestQuestionsSection'

export default function MockTestQuestionsSection({ watch, ...props }) {
  return (
    <TestQuestionsSection
      {...props}
      watch={watch}
      light={false}
      previewTitle={watch('mockTestTitle') || ''}
    />
  )
}
