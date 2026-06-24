import PageBanner from '../figma/PageBanner'
import { BannerButton } from '../academics/AcademicsUi'
import { cn } from '../../utils/cn'

export default function SubjectHeader({
  icon,
  title,
  onAdd,
  addLabel = '+ Add Subject',
  iconClassName = 'text-[#246392]',
  className,
}) {
  return (
    <PageBanner
      icon={icon}
      title={title}
      iconClassName={iconClassName}
      className={cn('sticky top-0 z-20', className)}
    >
      {onAdd && <BannerButton onClick={onAdd}>{addLabel}</BannerButton>}
    </PageBanner>
  )
}
