import ExamSubCategoryTableSkeleton from './ExamSubCategoryTableSkeleton'
import { CATEGORY_TABLE_LOADING_SHELL } from '../../utils/categoryUiStandards'
import { cn } from '../../utils/cn'

export default function CategoryTableLoadingShell({ className, children }) {
  return (
    <div className={cn(CATEGORY_TABLE_LOADING_SHELL, className)}>
      {children ?? <ExamSubCategoryTableSkeleton />}
    </div>
  )
}
