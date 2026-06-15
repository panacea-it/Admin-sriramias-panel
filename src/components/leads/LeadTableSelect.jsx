import LeadTableSearchableSelect from './LeadTableSearchableSelect'

export default function LeadTableSelect({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  placeholder,
  variant = 'counselor',
}) {
  return (
    <LeadTableSearchableSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      className={className}
      ariaLabel={ariaLabel}
      variant={variant}
      emptyMessage={variant === 'status' ? 'No statuses found' : 'No counselors found'}
    />
  )
}
