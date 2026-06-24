import CategoryStandardTable from './CategoryStandardTable'

export default function ProgramsTable({ tableMinWidth, ...props }) {
  return (
    <CategoryStandardTable skeletonRowCount={8} tableMinWidth={tableMinWidth} {...props} />
  )
}
