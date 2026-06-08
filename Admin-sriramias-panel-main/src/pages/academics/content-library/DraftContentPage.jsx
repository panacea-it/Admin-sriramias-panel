import ContentListPageShell from './ContentListPageShell'

export default function DraftContentPage() {
  return (
    <ContentListPageShell
      fixedStatus="Draft"
      showAdd={false}
      emptyMessage="No drafts — save uploads as draft from Upload Content."
    />
  )
}
