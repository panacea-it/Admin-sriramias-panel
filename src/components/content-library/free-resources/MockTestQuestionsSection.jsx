import TestQuestionsSection from './TestQuestionsSection'

export default function MockTestQuestionsSection({
  watch,
  mockTestId = null,
  questionsLoading = false,
  onQuestionsRefresh,
  bulkUploadOnly = false,
  ...props
}) {
  return (
    <TestQuestionsSection
      {...props}
      watch={watch}
      light={false}
      bulkUploadOnly={bulkUploadOnly}
      previewTitle={watch('mockTestTitle') || ''}
      mockTestId={mockTestId}
      questionsLoading={questionsLoading}
      onQuestionsRefresh={onQuestionsRefresh}
    />
  )
}
