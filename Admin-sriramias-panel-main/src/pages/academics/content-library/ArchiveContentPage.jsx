import ContentListPageShell from './ContentListPageShell'

export default function ArchiveContentPage() {
  return (
    <ContentListPageShell
      fixedStatus="Archived"
      showAdd={false}
      emptyMessage="Archive is empty."
    />
  )
}
