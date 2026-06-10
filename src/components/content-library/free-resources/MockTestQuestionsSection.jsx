import TestQuestionsSection from './TestQuestionsSection'

export default function MockTestQuestionsSection({
  watch,
  mockTestId = null,
  questionsLoading = false,
  onQuestionsRefresh,
  ...props
}) {
  return (
    <TestQuestionsSection
      {...props}
      watch={watch}
      light={false}
      previewTitle={watch('mockTestTitle') || ''}
      mockTestId={mockTestId}
      questionsLoading={questionsLoading}
      onQuestionsRefresh={onQuestionsRefresh}
    />
  )
}
