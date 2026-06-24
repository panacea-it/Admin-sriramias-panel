export default function YoutubeVideoTitleCell({ name }) {
  return (
    <span className="block truncate font-medium text-[#111]" title={name}>
      {name}
    </span>
  )
}
