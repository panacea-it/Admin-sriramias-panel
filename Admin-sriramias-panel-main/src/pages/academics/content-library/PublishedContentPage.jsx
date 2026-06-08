import ContentListPageShell from './ContentListPageShell'

export default function PublishedContentPage() {
  return (
    <ContentListPageShell
      fixedStatus="Published"
      showAdd={false}
      emptyMessage="No published content yet."
    />
  )
}
