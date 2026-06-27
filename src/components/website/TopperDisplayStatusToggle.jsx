import TopperTableToggle from './TopperTableToggle'

export default function TopperDisplayStatusToggle(props) {
  const { topperName = 'topper', ...rest } = props

  return (
    <TopperTableToggle
      variant="display"
      ariaLabelOn={`${topperName} is displayed on the customer website`}
      ariaLabelOff={`${topperName} is hidden from the customer website`}
      {...rest}
    />
  )
}
